
document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.querySelector('[data-collapse-toggle="navbar-hamburger"]');
    const menu = document.getElementById('navbar-hamburger');

    toggleButton.addEventListener('click', function () {
        menu.classList.toggle('hidden');
    });
});

document.addEventListener('DOMContentLoaded', function () {
    let calculationCount = 0;

    document.getElementById('addCalculation').addEventListener('click', function () {
        calculationCount++;
        const tableBody = document.getElementById('calculationsTable').getElementsByTagName('tbody')[0];
        const newRow = tableBody.insertRow();
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);

        cell1.textContent = `Cálculo ${calculationCount}`;
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Borrar';
        deleteButton.className = 'py-1 px-2 bg-red-500 text-white rounded hover:bg-red-700';
        deleteButton.onclick = function() {
            this.closest('tr').remove();
        };
        cell2.appendChild(deleteButton);
    });
});
