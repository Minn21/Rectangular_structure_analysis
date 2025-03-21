import fs from 'fs';
import path from 'path';

function printDirectoryTree(dir, prefix = '', isLast = true) {
    try {
        const files = fs.readdirSync(dir);
        const filteredFiles = files.filter(file => !file.startsWith('.') && file !== 'node_modules');
        const sortedFiles = filteredFiles.sort((a, b) => {
            const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
            const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
            return bIsDir - aIsDir; // Directories first
        });

        sortedFiles.forEach((file, index) => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            const isLastFile = index === sortedFiles.length - 1;
            
            process.stdout.write(prefix);
            process.stdout.write(isLast ? '└── ' : '├── ');
            process.stdout.write(file);
            process.stdout.write('\n');

            if (stats.isDirectory()) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                printDirectoryTree(filePath, newPrefix, isLastFile);
            }
        });
    } catch (error) {
        console.error('Error reading directory:', error.message);
    }
}

const rootDirectory = process.argv[2] || '.'; // Use current directory if none provided
console.log(`Project structure for: ${path.resolve(rootDirectory)}\n`);
printDirectoryTree(rootDirectory);