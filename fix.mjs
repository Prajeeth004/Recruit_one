import fs from 'fs';
import path from 'path';

const mappings = {
    'components/create-candidate-dialog': 'features/candidates/components/create-candidate-dialog',
    'components/candidate-actions': 'features/candidates/components/candidate-actions',
    'components/candidates-section': 'features/candidates/components/candidates-section',
    'components/create-job-dialog': 'features/jobs/components/create-job-dialog',
    'components/jobs-section': 'features/jobs/components/jobs-section',
    'components/job-candidates-table': 'features/jobs/components/job-candidates-table',
    'components/create-company-dialog': 'features/companies/components/create-company-dialog',
    'components/companies-section': 'features/companies/components/companies-section',
};

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next') processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            for (const [oldPath, newPath] of Object.entries(mappings)) {
                if (content.includes(oldPath)) {
                    content = content.replaceAll(oldPath, newPath);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}

processDir('./app');
processDir('./features');
console.log('Done');
