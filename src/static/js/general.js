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
        displayArea.style.overflowY = 'auto'; // Habilita el desplazamiento vertical
        displayArea.style.maxHeight = '90vh'; // Establece un alto máximo
        
        // Crea el formulario dentro del contenedor
        const formHtml = `
            <form id="calculationForm" class="row">
                <div class="col-12 d-flex justify-content-end mb-3">
                    <button type="submit" id="nextButton" class="btn btn-sm" style="background-color: #3C402D; display: flex; justify-content: flex-end; align-items: center;">
                        <span style="color: white;">Siguiente</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-arrow-right" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8"/>
                        </svg>
                    </button>
                </div>
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
                    <!-- Campos de número con etiquetas -->
                    <div class="form-group mb-2">
                        <label for="hullLength">Eslora del casco 'LH' (metros):</label>
                        <input type="number" class="form-control" id="hullLength" min="2.5" max="24" step="any" onchange="updateLWLBounds();">
                    </div>
                    <!-- Eslora en línea de flotación 'LWL' -->
                    <div class="form-group mb-2">
                        <label for="waterlineLength">Eslora en línea de flotación 'LWL' (metros):</label>
                        <input type="number" class="form-control" id="waterlineLength" min="2.5" step="any">
                    </div>
                    <!-- Manga en línea de flotación 'BWL' -->
                    <div class="form-group mb-2">
                        <label for="waterlineBeam">Manga en línea de flotación 'BWL' (metros):</label>
                        <input type="number" class="form-control" id="waterlineBeam" min="0">
                        <span id="waterlineBeamError" class="text-danger" style="display: none;">Error específico para BWL</span>
                    </div>
                    <div class="form-group mb-2">
                        <label for="chineBeam">Manga entre pantoques o 'chine' 'BC' (metros):</label>
                        <input type="number" class="form-control" id="chineBeam" min="0">
                        <span id="chineBeamError" class="text-danger" style="display: none;">Error específico para BC</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="height: 350px; overflow: hidden;  text-align:center">
                        <img src="static/img/bote.jpeg" class="img-fluid" alt="Imagen Descriptiva" style="object-fit: cover; height: 100%;">
                    </div>
                    <div class="form-group mb-2">
                        <label for="maxSpeed">Velocidad máxima 'V' (Nudos):</label>
                        <input type="number" class="form-control" id="maxSpeed" step="any">
                    </div>
                    <!-- Desplazamiento 'mLDC' -->
                    <div class="form-group mb-2">
                        <label for="displacement">Desplazamiento 'mLDC' (Kilogramos):</label>
                        <input type="number" class="form-control" id="displacement" min="0">
                        <span id="displacementError" class="text-danger" style="display: none;">Error específico para mLDC</span>
                    </div>
                    <!-- Ángulo de astilla muerta 'B04' -->
                    <div class="form-group mb-2">
                        <label for="deadRiseAngle">Ángulo de astilla muerta 'B04' en el LCG (°grados):</label>
                        <input type="number" class="form-control" id="deadRiseAngle" min="0">
                        <span id="deadRiseAngleError" class="text-danger" style="display: none;">Error específico para B04</span>
                    </div>
                </div>
            </form>
        `;

        newCalculationContainer.innerHTML = formHtml; 
        displayArea.appendChild(newCalculationContainer);
    
        const analysisTypeSelect = document.getElementById('analysisType');
        const samplingZoneSelect = document.getElementById('samplingZone');
        const materialSelect = document.getElementById('material');
    
        const updateCalculationName = () => {
            const analysisType = analysisTypeSelect.value !== 'Seleccione una opción' ? analysisTypeSelect.value : '';
            const samplingZone = samplingZoneSelect.value !== 'Seleccione una opción' ? samplingZoneSelect.value : '';
            const material = materialSelect.value !== 'Seleccione una opción' ? materialSelect.value : '';
            let calculationName = `Cálculo ${calculationCount}`;
            if (analysisType && samplingZone && material ) {
                calculationName = `${analysisType} ${samplingZone} (${material})`;
            }
    
            if (currentCalculationRow) {
                currentCalculationRow.cells[0].textContent = calculationName;
            }
        };
    
        analysisTypeSelect.addEventListener('change', updateCalculationName);
        samplingZoneSelect.addEventListener('change', updateCalculationName);
        materialSelect.addEventListener('change', updateCalculationName);
        updateCalculationName();

        const hullLength = document.getElementById('hullLength');
        const waterlineLength = document.getElementById('waterlineLength');
        const maxSpeed = document.getElementById('maxSpeed');

        hullLength.addEventListener('change', function() {
            const lhValue = parseFloat(hullLength.value);
            waterlineLength.setAttribute('max', lhValue);
            validateWaterlineLength(); 
        });

        function updateLWLBounds() {
            const lhValue = document.getElementById('hullLength').value;
            const lwlInput = document.getElementById('waterlineLength');

            lwlInput.min = 2.5;
            lwlInput.max = lhValue;
        }

        waterlineLength.addEventListener('change', function() {
            const lwlValue = parseFloat(waterlineLength.value);
            const minSpeed = 2.36 * Math.sqrt(lwlValue);
            maxSpeed.setAttribute('min', minSpeed.toFixed(2)); // Mantiene la precisión decimal
        });
        
        function updateMaxSpeedMin() {
            const lwlValue = parseFloat(waterlineLength.value);
            if (!isNaN(lwlValue)) { // Verifica que lwlValue sea un número
                const minSpeed = 2.36 * Math.sqrt(lwlValue);
                maxSpeed.setAttribute('min', minSpeed.toFixed(2)); // Formatea a 2 decimales
            }
        }
        
        // Llamar a updateMaxSpeedMin en caso de que LWL ya tenga un valor cuando se carga la página
        document.addEventListener('DOMContentLoaded', updateMaxSpeedMin);

        document.getElementById('calculationForm').addEventListener('submit', function(event) {
            event.preventDefault(); // Previene el envío del formulario

            const formData = {
                designCategory: document.getElementById('designCategory').value,
                material: document.getElementById('material').value,
                samplingZone: document.getElementById('samplingZone').value,
                analysisType: document.getElementById('analysisType').value,
                hullLength: document.getElementById('hullLength').value,
                waterlineLength: document.getElementById('waterlineLength').value,
                waterlineBeam: document.getElementById('waterlineBeam').value,
                chineBeam: document.getElementById('chineBeam').value,
                maxSpeed: document.getElementById('maxSpeed').value,
                displacement: document.getElementById('displacement').value,
                deadRiseAngle: document.getElementById('deadRiseAngle').value
            };

            console.log(formData); 
        });
        
    });
});
