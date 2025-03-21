import { BuildingParameters, BeamResults, CalculationResults } from './types';

function calculateBeamResults(w: number, L: number, E: number, I: number, h: number): BeamResults {
    // Simply supported beam under uniform load
    const maxDeflection = (5 * w * L ** 4) / (384 * E * I);
    const M_max = (w * L ** 2) / 8;
    const c = h / 2;
    const maxStress = (M_max * c) / I;
    const reactions = [w * L / 2, w * L / 2];
    return { 
        maxDeflection, 
        maxStress, 
        reactionLeft: reactions[0],
        reactionRight: reactions[1] 
    };
}

export function calculateBuildingResults(params: BuildingParameters): CalculationResults {
    const {
        buildingLength: L,
        buildingWidth: W,
        buildingHeight: H,
        numberOfStoreys: Ns,
        columnsAlongLength: M,
        columnsAlongWidth: N,
        beamsAlongLength: Bx,
        beamsAlongWidth: Bz,
        slabLoad: q,
        beamWidth: b,
        beamHeight: h,
        elasticModulus: E,
        columnWidth: cw,
        columnDepth: cd,
    } = params;

    const dx = L / (M - 1); // Spacing between columns along x
    const dz = W / (N - 1); // Spacing between columns along z
    const I = (b * h ** 3) / 12; // Moment of inertia for beams
    const beamResults: BeamResults[] = [];
    
    // Beams along x-direction
    const beamLengthX = dx; // Length of each beam segment along x
    for (let k = 1; k <= Ns; k++) {
        for (let j = 0; j < N; j++) {
            const isEdgeZ = j === 0 || j === N - 1;
            const tributaryWidth = isEdgeZ ? dz / 2 : dz;
            const w = q * tributaryWidth;
            for (let i = 0; i < M - 1; i++) {
                const beamResult = calculateBeamResults(w, beamLengthX, E, I, h);
                beamResults.push(beamResult);
            }
        }
    }

    // Beams along z-direction
    const beamLengthZ = dz; // Length of each beam segment along z
    for (let k = 1; k <= Ns; k++) {
        for (let i = 0; i < M; i++) {
            const isEdgeX = i === 0 || i === M - 1;
            const tributaryWidth = isEdgeX ? dx / 2 : dx;
            const w = q * tributaryWidth;
            for (let j = 0; j < N - 1; j++) {
                const beamResult = calculateBeamResults(w, beamLengthZ, E, I, h);
                beamResults.push(beamResult);
            }
        }
    }

    // Column axial loads
    const columnAxialLoads: number[] = [];
    for (let i = 0; i < M; i++) {
        for (let j = 0; j < N; j++) {
            let A = 0;
            if (i === 0 || i === M - 1) A = dx / 2;
            else A = dx;
            if (j === 0 || j === N - 1) A *= dz / 2;
            else A *= dz;
            const axialLoad = q * A * Ns;
            columnAxialLoads.push(axialLoad);
        }
    }

    const maxBeamDeflection = Math.max(...beamResults.map(b => b.maxDeflection));
    const maxBeamStress = Math.max(...beamResults.map(b => b.maxStress));
    const columnArea = cw * cd;
    const maxColumnStress = Math.max(...columnAxialLoads.map(F => F / columnArea));

    return {
        beamResults,
        columnAxialLoads,
        maxBeamDeflection,
        maxBeamStress,
        maxColumnStress,
    };
}