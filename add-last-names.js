import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the current desk.json file
const deskJsonPath = path.join(__dirname, 'src', 'model', 'desk.json');
const deskData = JSON.parse(fs.readFileSync(deskJsonPath, 'utf8'));

// List of common last names to randomly assign
const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
    'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
    'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
    'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
    'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez'
];

// Function to get a random last name
function getRandomLastName() {
    return lastNames[Math.floor(Math.random() * lastNames.length)];
}

// Function to check if name already has a last name (contains space)
function hasLastName(name) {
    return name.includes(' ');
}

// Update each desk entry
let updatedCount = 0;
deskData.forEach((desk, index) => {
    if (!hasLastName(desk.name)) {
        const lastName = getRandomLastName();
        desk.name = `${desk.name} ${lastName}`;
        updatedCount++;
        console.log(`Updated: ${desk.name} (ID: ${desk.id})`);
    }
});

// Write the updated data back to the file
fs.writeFileSync(deskJsonPath, JSON.stringify(deskData, null, 4));

console.log(`\n✅ Updated ${updatedCount} desk entries with last names`);
console.log(`📁 File saved: ${deskJsonPath}`);
