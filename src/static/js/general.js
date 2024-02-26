document.addEventListener('DOMContentLoaded', function () {
    let calculationCount = 0;
    let currentCalculationRow = null; // Referencia a la fila actual del cálculo

    document.getElementById('addCalculation').addEventListener('click', function () {
        calculationCount++;
        const tableBody = document.getElementById('calculationsTable').getElementsByTagName('tbody')[0];
        currentCalculationRow = tableBody.insertRow(); // Guarda la fila recién creada
        const cell1 = currentCalculationRow.insertCell(0);
        cell1.textContent = `Cálculo ${calculationCount}`;

        const displayArea = document.getElementById('calculationDisplay');
        displayArea.innerHTML = ''; // Limpia el contenedor antes de añadir un nuevo elemento

        const newCalculationContainer = document.createElement('div');
        newCalculationContainer.classList.add('rounded', 'bg-white');
        newCalculationContainer.style.margin = '20px';
        newCalculationContainer.style.padding = '20px';
        newCalculationContainer.style.boxShadow = '0px 0px 10px #aaa';
        newCalculationContainer.style.minHeight = '200px';
        
        // Crea el formulario dentro del contenedor
        const formHtml = `
        <form id="calculationForm" class="row">
            <div class="col-md-6">
                <div class="form-group">
                    <label for="designCategory">Categoría de diseño:</label>
                    <select class="form-control mb-2" id="designCategory">
                        <option>Seleccione una opción</option>
                        <option>Oceano</option>
                        <option>Offshore</option>
                        <option>Inshore</option>
                        <option>Aguas protegidas</option>
                    </select>
                </div>
                <div class="form-group mb-2">
                    <label for="material">Material general de la embarcación:</label>
                    <select class="form-control" id="material">
                        <option>Seleccione una opción</option>
                        <option>Acero</option>
                        <option>Aluminio</option>
                        <option>Madera (laminada y plywood)</option>
                        <option>Fibra laminada</option>
                        <option>Fibra con nucleo (Sandwich)</option>
                    </select>
                </div>
                <div class="form-group mb-2" >
                    <label for="samplingZone">Zona de escantillonado:</label>
                    <select class="form-control" id="samplingZone">
                        <option>Seleccione una opción</option>
                        <option>Fondo</option>
                        <option>Costados y Espejo</option>
                        <option>Cubierta</option>
                        <option>Superestructura</option>
                        <option>Mamparos estancos</option>
                        <option>Mamparos de tanques integrales</option>
                        <option>Placas anti oleaje</option>
                        <option>Mamparos de colisión</option>
                    </select>
                </div>
                <div class="form-group mb-2">
                    <label for="analysisType" >Tipo de análisis:</label>
                    <select class="form-control" id="analysisType">
                        <option>Seleccione una opción</option>
                        <option>Plating</option>
                        <option>Stiffeners</option>
                    </select>
                </div>
                <!-- Campos de número -->
                <div class="form-group mb-2"><input type="number" class="form-control" placeholder="Eslora del casco 'LH' (metros)"></div>
                <div class="form-group mb-2"><input type="number" class="form-control" placeholder="Eslora en línea de flotación 'LWL' (metros)"></div>
                <div class="form-group mb-2"><input type="number" class="form-control" placeholder="Manga en línea de flotación 'BWL' (metros)"></div>
                <div class="form-group mb-2"><input type="number" class="form-control" placeholder="Manga entre pantoques o 'chine' 'BC' (metros)"></div>
            </div>
            <div class="col-md-6">
                <div style="height: 326px; overflow: hidden;  text-align:center">
                    <img src="static/img/bote.jpeg" class="img-fluid" alt="Imagen Descriptiva" style="object-fit: cover; height: 100%;">
                </div>
                <div class="form-group mb-2"><input type="number" class="form-control" placeholder="Velocidad máxima 'V' (Nudos)"></div>
                <div class="form-group mb-2"><input type="number" class="form-control" placeholder="Desplazamiento 'mLDC' (Kilogramos)"></div>
                <div class="form-group mb-2"><input type="number" class="form-control" placeholder="Ángulo de astilla muerta 'B04' en el LCG (°grados)"></div>
            </div>
        </form>
        `;

        newCalculationContainer.innerHTML = formHtml; // Usa el formHtml ya definido
        displayArea.appendChild(newCalculationContainer);
    
        // Ahora que el formulario está en el DOM, podemos acceder a los elementos select
        const analysisTypeSelect = document.getElementById('analysisType');
        const samplingZoneSelect = document.getElementById('samplingZone');
    
        // Función para actualizar el nombre del cálculo en la fila actual de la tabla
        const updateCalculationName = () => {
            const analysisType = analysisTypeSelect.value !== 'Seleccione una opción' ? analysisTypeSelect.value : '';
            const samplingZone = samplingZoneSelect.value !== 'Seleccione una opción' ? samplingZoneSelect.value : '';
            let calculationName = `Cálculo ${calculationCount}`;
            if (analysisType && samplingZone) {
                calculationName = `${analysisType} ${samplingZone}`;
            }
    
            // Actualiza la celda de la fila actual en lugar de crear una nueva
            if (currentCalculationRow) {
                currentCalculationRow.cells[0].textContent = calculationName;
            }
        };
    
        // Añade manejadores de eventos para actualizar el nombre cuando se seleccionan las opciones
        analysisTypeSelect.addEventListener('change', updateCalculationName);
        samplingZoneSelect.addEventListener('change', updateCalculationName);
    
        // Llama a updateCalculationName inicialmente para establecer el nombre por defecto
        updateCalculationName();
    });
});
