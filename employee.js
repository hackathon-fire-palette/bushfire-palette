import { personnel } from './rosterData.js';

document.addEventListener('DOMContentLoaded', () => {
    const employeeList = document.getElementById('employee-list');
    const addEmployeeForm = document.getElementById('add-employee-form');

    // Initial data from rosterData.js
    let employees = personnel;

    const renderEmployees = () => {
        employeeList.innerHTML = '';
        employees.forEach((employee, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.name}</td>
                <td>${employee.role}</td>
                <td>${employee.availability}</td>
                <td>
                    <button onclick="editEmployee(${index})">Edit</button>
                    <button onclick="deleteEmployee(${index})">Delete</button>
                </td>
            `;
            employeeList.appendChild(row);
        });
    };

    addEmployeeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const role = document.getElementById('role').value;
        const availability = document.getElementById('availability').value;
        // A simple ID generation
        const id = employees.length > 0 ? Math.max(...employees.map(e => e.id)) + 1 : 1;
        employees.push({ id, name, role, availability, skills: [], contact: '', phone: '' });
        renderEmployees();
        addEmployeeForm.reset();
    });

    window.editEmployee = (index) => {
        const employee = employees[index];
        const name = prompt('Enter new name:', employee.name);
        const role = prompt('Enter new role:', employee.role);
        const availability = prompt('Enter new availability:', employee.availability);
        if (name !== null && role !== null && availability !== null) {
            employees[index] = { ...employee, name, role, availability };
            renderEmployees();
        }
    };

    window.deleteEmployee = (index) => {
        if (confirm('Are you sure you want to delete this employee?')) {
            employees.splice(index, 1);
            renderEmployees();
        }
    };

    renderEmployees();
});
