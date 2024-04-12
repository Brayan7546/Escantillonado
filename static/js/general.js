document.addEventListener('DOMContentLoaded', function () {
    let calculationCount = 0;
    let currentCalculationRow = null;
    let selectedRow = null;
    let temporaryFormData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
    let isAddingNewCalculation = false;
    let currentSamplingZone = '';
    let lastInteractedField = null;
    var dataAcron = [
        { acronym: 'Kar', label: 'Factor de reducción de la presión del área' },
        { acronym: 'Kl', label: 'Factor de distribución longitudinal de presión' },
        { acronym: 'Kdc', label: 'Factor de categoría de diseño' },
        { acronym: 'Kz', label: 'Factor de distribución vertical de presión' },
        { acronym: 'Ksup', label: 'Factor de reducción de presión de la superestructura' },
        { acronym: 'Hb', label: 'Altura de la columna de agua' },
        { acronym: 'b', label: 'Dimensión más corta del panel de la lámina' },
        { acronym: 'l', label: 'Dimensión más larga del panel de la lámina' },
        { acronym: 'c', label: 'Corona o curvatura del panel' },
        { acronym: 'k2', label: 'Factor de relación de aspecto del panel para la resistencia a la flexión' },
        { acronym: 'x', label: 'Distancia desde la popa de la línea de flotación hasta el centro del panel o refuerzo' },
        { acronym: 'Kc', label: 'Factor de corrección de curvatura para el chapado' },
        { acronym: 'Sigma u', label: 'Esfuerzo último a la tracción' },
        { acronym: 'sigma y', label: 'Esfuerzo de fluencia a la tracción' },
        { acronym: 'sigma d', label: 'Esfuerzo de diseño' },
        { acronym: 'T final', label: 'Espesor mínimo requerido' },
        { acronym: 'sigma uf', label: 'Esfuerzo último a la flexión' },
        { acronym: 'sigma ut', label: 'Esfuerzo último a la tracción de la fibra externa' },
        { acronym: 'sigma uc', label: 'Esfuerzo último a la compresión de la fibra interna' },
        { acronym: 'eio', label: 'Promedio de los módulos de Young de las fibras internas y externas' },
        { acronym: 'tau u', label: 'Esfuerzo último al cortante del núcleo' },
        { acronym: 'k3', label: 'Factor de relación de aspecto del panel para la resistencia a la flexión' },
        { acronym: 'sigma dt', label: 'Esfuerzo de tracción de diseño de la fibra exterior' },
        { acronym: 'sigma dc', label: 'Esfuerzo de compresión de diseño de la fibra interior' },
        { acronym: 'tau d', label: 'Esfuerzo cortante de diseño del núcleo' },
        { acronym: 'sm inner', label: 'Módulo de sección mínimo requerido de la cara exterior de 1cm de ancho' },
        { acronym: 'sm outter', label: 'Módulo de sección mínimo requerido de la cara interior de 1cm de ancho' },
        { acronym: 'second I', label: 'Segundo momento de inercia mínimo requerido para una cara de 1 cm de ancho' },
        { acronym: 'wos', label: 'Masa de fibra mínima requerida de la fibra exterior' },
        { acronym: 'wis', label: 'Masa de fibra mínima requerida de la fibra interior' },
        { acronym: 's', label: 'Separación entre refuerzos' },
        { acronym: 'cu', label: 'Corona o curvatura' },
        { acronym: 'ksa', label: 'Factor de área del cortante' },
        { acronym: 'lu', label: 'Longitud no soportada del refuerzo' },
        { acronym: 'SM', label: 'Módulo de sección mínimo requerido' },
        { acronym: 'tau', label: 'Resistencia al cortante mínima' },
        { acronym: 'sigma ct', label: 'Esfuerzo último' },
        { acronym: 'I', label: 'Segundo momento de área mínimo requerido' },
        { acronym: 'AW', label: 'Área del alma mínima requerida' },
        ];
    
    loadUserCalculations(); 
    const { jsPDF } = window.jspdf;

    const shipNameInput = document.getElementById('shipName');
    const doneByInput = document.getElementById('doneBy');
    const dateInput = document.getElementById('date');

    document.getElementById('exportCalculation').addEventListener('click', function () {
        const selectedRows = document.querySelectorAll('.calculation-select:checked');
        const selectedIds = Array.from(selectedRows).map(row => row.dataset.id);
        
        if (selectedIds.length === 0) {
            Swal.fire({
                icon: 'error',
                title: 'No se han seleccionado cálculos',
                text: 'Por favor, seleccione al menos un cálculo para exportar.',
            });
            return;
        }

        generatePDF(selectedIds);
    });
    
    function generatePDF(selectedIds) {
        const generalData = JSON.parse(localStorage.getItem('generalData'));
        const tempFormData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};

        let allDataAvailable = true;
        let missingDataMessage = '';

        selectedIds.forEach(id => {
            const data = tempFormData[id];

            if (
                data.resultados === null ||
                typeof data.resultados === 'undefined' ||
                Object.keys(data.resultados).length === 0
            ) {
                allDataAvailable = false;
                missingDataMessage = `El cálculo ${id} no se puede exportar debido a falta de información para los resultados.`;
            } else {
                // Recorrer el diccionario de resultados para verificar si algún valor es null
                for (const key in data.resultados) {
                    if (data.resultados[key] === null) {
                        allDataAvailable = false;
                        missingDataMessage = `El cálculo ${id} no se puede exportar debido a falta de información para calcular ${key}.`;
                        break; // Salir del bucle tan pronto como se encuentre un valor null
                    }
                }
            }
        });

        if (!allDataAvailable) {
            Swal.fire({
                title: 'Error',
                text: missingDataMessage,
                icon: 'error',
            });
            return;
        }

        const doc = new jsPDF();
        const imageUrl = 'static/img/Fondo pdf.png'; 


        // Encabezado con información general en la primera página
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);  // Ajusta el tamaño de la fuente
        doc.setTextColor(85, 115, 89);

        // Texto a alinear en el centro
        const shipNameText = `Embarcación: ${generalData.shipName || ''}`;
        const doneByText = `Realizado por: ${generalData.doneBy || ''}`;
        const dateText = `Fecha: ${generalData.date || ''}`;

        const startY = 30;

        doc.addImage(imageUrl, 'JPEG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);
        doc.text(shipNameText, 14, startY);
        doc.text(doneByText, 14, startY + 10);
        doc.text(dateText, 14, startY + 20); 
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);  
        doc.setTextColor(85, 115, 89);

        doc.text("Información Especifica", 14, startY + 30);
        doc.autoTable({
            head: [['Acrónimo', 'Descripción']],
            body: dataAcron.map(item => [item.acronym, item.label]),
            startY: startY + 34,
                headStyles: {
                    fillColor: [85, 115, 89]  // RGB equivalent of #557359
                }, styles: {
                    cellPadding: 1, // Reduce el relleno de las celdas para que la tabla sea más compacta
                }, margin: { bottom: 30, top: 30 }
          }); 
          doc.addImage(imageUrl, 'JPEG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);      

        doc.addPage();
    
        // Recorremos cada ID seleccionado
        selectedIds.forEach((id, index) => {
            if (index > 0) {
                doc.addPage();
            }
            const data = tempFormData[id];
            const resultados = data.resultados;
            const type = (data.V / Math.sqrt(data.LWL)) < 5 ? 'Displacement' : 'Planning';
            doc.addImage(imageUrl, 'JPEG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);

            // Información específica del cálculo actual
            doc.text(`Cálculo ID: ${id}`, 14, 30);
            const infoRows = [
                ["Cat. Diseño", "Categoría de diseño", data.designCategory, ""],
                ["Material", "Material de escantillonado", data.material, ""],
                ["Tipo", "Tipo de embarcación", type, ""],  // Asegúrate de que 'type' se calcula correctamente antes de esto
                ["Zona", "Zona de escantillonado", data.samplingZone, ""],
                ["LH", "Eslora del casco", data.LH, "m"],
                ["LWL", "Eslora en línea de flotación", data.LWL, "m"],
                ["BWL", "Manga en línea de flotación", data.BWL, "m"],
                ["BC", "Manga entre pantoques", data.BC, "m"],
                ["V", "Velocidad máxima de diseño", data.V, "nudos"],
                ["mLDC", "Desplazamiento de la embarcación", data.mLDC, "kg"],
                ["B04", "Astilla muerta de fondo", data.B04, "grados"]
            ];
            
            doc.autoTable({
                head: [['Acron', 'Descripción', 'Valor', 'Unidad']],
                body: infoRows,
                startY: 33,
                headStyles: {
                    fillColor: [85, 115, 89]  // RGB equivalent of #557359
                }, styles: {
                    cellPadding: 1, // Reduce el relleno de las celdas para que la tabla sea más compacta
                }
            });

            let currentY = doc.lastAutoTable.finalY + 8;

            const pressureData = resultados.pressure;

            // Tabla de presión
            let pressureTableHead;
            let pressureTableBody = [];
            
            if (data.samplingZone === 'Superestructura') {
                pressureTableHead = [['Ubicación', 'KAR', 'KDC', 'KSUP', 'Presión']];
                const pressureDetails = resultados.pressure.PSUP_M_values;
                const kSUP_values = resultados.pressure.kSUP_values;
            
                for (const location in pressureDetails) {
                    pressureTableBody.push([
                        location,
                        resultados.pressure.kAR.toFixed(5),
                        resultados.pressure.kDC.toFixed(5),
                        kSUP_values[location].toFixed(5),
                        `${pressureDetails[location].toFixed(5)} MPa` // Unidad concatenada directamente al valor
                    ]);
                }
            } else {
                // Lógica para otras zonas de escantillonado
                pressureTableHead = [['Sección', 'Valor', 'Unidad']];
                pressureTableBody = Object.entries(pressureData).map(([key, value]) => {
                    let unit = '';
                    if (key === 'Pressure') {
                        unit = 'MPa';  // Asumiendo que la unidad para presión es MPa
                    }
                    
                    return [key, typeof value === 'number' ? value.toFixed(5) : value, unit];
                });
            }

            // Tabla de plating o stiffeners
            let platingStiffenersHead = [];
            let platingStiffenersBody = [];

            if (data.analysisType === 'Plating') {
                switch (data.material) {
                    case 'Acero':
                    case 'Aluminio':
                        if (data.samplingZone === 'Superestructura' && (data.material === 'Acero' || data.material === 'Aluminio')) {
                            platingStiffenersHead = [['Location', 'b', 'l', 'c', 'x', 'k2', 'kc',  'sigma uf',  'sigma d', 'Tfinal']];
                        
                            Object.entries(resultados).forEach(([location, result]) => {
                                if (location !== 'pressure') { 
                                    platingStiffenersBody.push([
                                        location,
                                        data.b,
                                        data.l,
                                        data.c,
                                        data.x,
                                        result.k2.toFixed(5),
                                        result.kC.toFixed(5),
                                        data.sigmaUf,
                                        result.sigmaD.toFixed(5),
                                        result.thickness.toFixed(5),
                                    ]);
                                }
                            });
                        
                        } else {
                            platingStiffenersHead = [['Property', 'Value']];
                            platingStiffenersBody = [
                                ['b (mm)', data.b],
                                ['l (mm)', data.l],
                                ['k2', resultados.k2.toFixed(5)],
                                ['x (m)', data.x],
                                ['c (mm)', data.c],
                                ['kc', resultados.kC.toFixed(5)],
                                ['Sigma u (MPa)', data.sigmaU],
                                ['Sigma y (MPa)', data.sigmaY],
                                ['Sigma d (MPa)', resultados.sigmaD.toFixed(5)],
                                ['tfinal (mm)', resultados.thickness.toFixed(5)]
                            ];
                        }
                        break;
                    case 'Madera (laminada y plywood)':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 'b', 'l', 'k2', 'x', 'Sigma Uf', 'Sigma D', 'Tfinal']];
                            Object.entries(resultados).forEach(([location, result]) => {
                                if (location !== 'pressure') {
                                    platingStiffenersBody.push([
                                        location,
                                        data.b + ' mm',
                                        data.l + ' mm',
                                        result.k2.toFixed(5),
                                        data.x + ' m',
                                        data.sigmaUf + ' MPa',
                                        result.sigmaD.toFixed(5) + ' MPa',
                                        result.thickness.toFixed(5) + ' mm'
                                    ]);
                                }
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['b', data.b, 'mm'],
                                ['l', data.l, 'mm'],
                                ['k2', resultados.k2.toFixed(5), ''],
                                ['x', data.x, 'm'],
                                ['Sigma uf', data.sigmaUf, 'MPa'],
                                ['Sigma d', resultados.sigmaD.toFixed(5), 'MPa'],
                                ['Tfinal', resultados.thickness.toFixed(5), 'mm']
                            ];
                        }
                        break; 
                    case 'Fibra laminada':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 'b (mm)', 'l (mm)', 'k2', 'x (m)', 'c (mm)', 'kc', 'Sigma uf', 'Sigma d', 'Tfinal']];
                            Object.entries(resultados).forEach(([location, result]) => {
                                if (location !== 'pressure') { // Excluimos el objeto de presión
                                    platingStiffenersBody.push([
                                        location,
                                        `${data.b} mm`,
                                        `${data.l} mm`,
                                        result.k2.toFixed(5),
                                        `${data.x} m`,
                                        `${data.c} mm`,
                                        result.kC.toFixed(5),
                                        `${data.sigmaUf} MPa`,
                                        `${result.sigmaD.toFixed(5)} MPa`,
                                        `${result.thickness.toFixed(5)} mm`
                                    ]);
                                }
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['b', data.b, 'mm'],
                                ['l', data.l, 'mm'],
                                ['k2', resultados.k2.toFixed(5), ''],
                                ['x', data.x, 'm'],
                                ['c', data.c, 'mm'],
                                ['kc', resultados.kC.toFixed(5), ''],
                                ['Sigma uf', data.sigmaUf, 'MPa'],
                                ['Sigma d', resultados.sigmaD.toFixed(5), 'MPa'],
                                ['Tfinal', resultados.thickness.toFixed(5), 'mm']
                            ];
                        }
                        break;
                    case 'Fibra con nucleo (Sandwich)':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 'b', 'l', 'k1', 'k2', 'k3', 'x', 'c', 'kc', 'Sigma UT', 'Sigma UC', 'Eio', 'Tau U', 'kSHC', 'Tfinal', 'Sigma DT', 'Sigma DC', 'Tau D', 'SM Inner', 'SM Outter', 'Second I', 'Wos', 'Wis']];
                            Object.keys(resultados).filter(zone => zone !== 'pressure').forEach(zone => {
                                let result = resultados[zone];
                                platingStiffenersBody.push([
                                    zone,
                                    `${data.b} mm`,
                                    `${data.l} mm`,
                                    result.k1.toFixed(3),
                                    result.k2.toFixed(3),
                                    result.k3.toFixed(3),
                                    `${data.x} m`,
                                    `${data.c} mm`,
                                    result.KC.toFixed(3),
                                    `${data.sigmaUt} MPa`,
                                    `${data.sigmaUc} MPa`,
                                    `${data.eio} MPa`,
                                    `${data.tauU} MPa`,
                                    result.kSHC.toFixed(3),
                                    `${result.thickness.toFixed(3)} mm`,
                                    `${result.sigma_dt.toFixed(3)} MPa`,
                                    `${result.sigma_dc.toFixed(3)} MPa`,
                                    `${result.tau_d.toFixed(3)} MPa`,
                                    `${result.SM_inner.toFixed(6)} mm³`,
                                    `${result.SM_outter.toFixed(6)} mm³`,
                                    `${result.second_I.toExponential(3)} mm⁴`,
                                    result.wos ? `${result.wos.toFixed(5)} g/m²` : 'N/A',
                                    result.wis ? `${result.wis.toFixed(5)} g/m²` : 'N/A'
                                ]);
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['b', data.b, 'mm'],
                                ['l', data.l, 'mm'],
                                ['k1', resultados.k1.toFixed(3), ''],
                                ['k2', resultados.k2.toFixed(3), ''],
                                ['k3', resultados.k3.toFixed(3), ''],
                                ['x', data.x, 'm'],
                                ['c', data.c, 'mm'],
                                ['kc', resultados.KC.toFixed(3), ''],
                                ['Sigma UT', data.sigmaUt, 'MPa'],
                                ['Sigma UC', data.sigmaUc, 'MPa'],
                                ['Eio', data.eio, 'MPa'],
                                ['Tau U', data.tauU, 'MPa'],
                                ['kSHC', resultados.kSHC.toFixed(3), ''],
                                ['Tfinal', resultados.thickness.toFixed(3), 'mm'],
                                ['Sigma DT', resultados.sigma_dt.toFixed(3), 'MPa'],
                                ['Sigma DC', resultados.sigma_dc.toFixed(3), 'MPa'],
                                ['Tau D', resultados.tau_d.toFixed(3), 'MPa'],
                                ['SM Inner', resultados.SM_inner.toFixed(6), 'mm³'],
                                ['SM Outter', resultados.SM_outter.toFixed(6), 'mm³'],
                                ['Second I', resultados.second_I.toExponential(3), 'mm⁴'],
                                ['Wos', resultados.wos ? resultados.wos.toFixed(5) : 'N/A', 'g/m²'],
                                ['Wis', resultados.wis ? resultados.wis.toFixed(5) : 'N/A', 'g/m²']
                            ];
                        }
                        break;
                    }
            } else { 
                switch (data.material) {
                    case 'Acero':
                    case 'Aluminio':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 's', 'lu', 'cu', 'x', 'KSA', 'sigma y', 'sigma d', 'tau d', 'SM', 'AW']];
                        
                            // Itera sobre los resultados para construir el cuerpo de la tabla
                            Object.entries(resultados.resultsAW).forEach(([location, awValue]) => {
                                let smValue = resultados.SM[location];
                                let sigmaD = resultados.sigmaD;
                                let tauD = resultados.tauD;
                                let kSA = resultados.kSA;
                        
                                // Asumiendo que `data.s`, `data.lu`, `data.cu`, `data.x` son valores globales
                                platingStiffenersBody.push([
                                    location,  // Ubicación
                                    data.s,  // s
                                    data.lu, // lu
                                    data.cu, // cu
                                    data.x,  // x
                                    kSA.toFixed(5),     // KSA
                                    data.sigmaY,  // sigma y
                                    sigmaD.toFixed(5),  // sigma d
                                    tauD.toFixed(5),    // tau d
                                    `${smValue.toExponential(5)}`,
                                    `${awValue.toExponential(5)}`
                                ]);
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['S', data.s, ''],
                                ['Cu', data.cu, ''],
                                ['kSA', resultados.kSA, ''],
                                ['Lu', data.lu, 'm'],
                                ['X', data.x, 'm'],
                                ['Sigma Y', data.sigmaY, 'MPa'],
                                ['Sigma D', resultados.sigmaD, 'MPa'],
                                ['Tau D', resultados.tauD, 'MPa'],
                                ['AW', resultados.AW, ''],
                                ['SM', resultados.SM, 'mm³']
                            ];
                        }
                        break;                        
                    case 'Madera (laminada y plywood)':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 's', 'lu', 'cu', 'x', 'KSA', 'sigma uf', 'sigma d', 'tau', 'tau d', 'SM', 'AW']];
                        
                            Object.entries(resultados.resultsAW).forEach(([location, awValue]) => {
                                let smValue = resultados.SM[location];
                                let sigmaD = resultados.sigmaD;
                                let tauD = resultados.tauD;
                                let kSA = resultados.kSA;
                    
                                platingStiffenersBody.push([
                                    location,  
                                    data.s, 
                                    data.lu,
                                    data.cu, 
                                    data.x, 
                                    kSA.toFixed(5), 
                                    data.sigmaUf, 
                                    sigmaD.toFixed(5),
                                    data.tau,  
                                    tauD.toFixed(5), 
                                    `${smValue.toExponential(5)}`,
                                    `${awValue.toExponential(5)}`
                                ]);
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['S', data.s, ''],
                                ['Lu', data.lu, 'm'],
                                ['Cu', data.cu, ''],
                                ['X', data.x, 'm'],
                                ['kSA', resultados.kSA, ''],
                                ['Sigma UF', data.sigmaUf.toFixed(5), 'MPa'],
                                ['Sigma D', resultados.sigmaD.toFixed(5), 'MPa'],
                                ['Tau', data.tau.toFixed(5), ''],
                                ['Tau D', resultados.tauD.toFixed(5), 'MPa'],
                                ['SM', resultados.SM.toFixed(5), 'mm³'],
                                ['AW', resultados.AW.toFixed(5), '']
                            ];
                        }
                        break;
                    case 'Fibra laminada':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 's', 'lu', 'cu', 'x', 'KSA', 'sigma ct', 'sigma d', 'tau', 'tau d', 'I', 'SM', 'AW']];
                        
                            Object.entries(resultados.resultsAW).forEach(([location, awValue]) => {
                                let smValue = resultados.SM[location];
                                let sigmaD = resultados.sigmaD;
                                let tauD = resultados.tauD;
                                let kSA = resultados.kSA;
                                let I = resultados.I[location]
                    
                                platingStiffenersBody.push([
                                    location,  
                                    data.s, 
                                    data.lu,
                                    data.cu, 
                                    data.x, 
                                    kSA.toFixed(5), 
                                    data.sigmaCt, 
                                    sigmaD.toFixed(5),
                                    data.tau,  
                                    tauD.toFixed(5), 
                                    `${I.toExponential(5)}`,
                                    `${smValue.toExponential(5)}`,
                                    `${awValue.toExponential(5)}`
                                ]);
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['S', data.s, ''],
                                ['Lu', data.lu, 'm'],
                                ['Cu', data.cu, ''],
                                ['X', data.x, 'm'],
                                ['kSA', resultados.kSA, ''],
                                ['Sigma ct', data.sigmaCt, 'MPa'],
                                ['Sigma D', resultados.sigmaD.toFixed(5), 'MPa'],
                                ['Tau', data.tau, ''],
                                ['Tau D', resultados.tauD.toFixed(5), 'MPa'],
                                ['I', resultados.I, ''],
                                ['SM', resultados.SM.toFixed(5), 'mm³'],
                                ['AW', resultados.AW.toFixed(5), '']
                            ];
                        }
                        break;
                }
                    
            }

            doc.text("Presión", 14, currentY);
            currentY += 3;
            doc.autoTable({
                head: pressureTableHead,
                body: pressureTableBody,
                startY: currentY,
                headStyles: {
                    fillColor: [85, 115, 89]  // RGB equivalent of #557359
                }, styles: {
                    cellPadding: 1, 
                }
            });
    
            currentY = doc.lastAutoTable.finalY + 8;
    
            // Determinar el ancho de la columna de ubicación basado en el número total de columnas
            let totalColumns = platingStiffenersHead[0].length;
            let locationColumnWidth = totalColumns > 5 ? 40 : 30; // Aumentar el ancho si hay muchas columnas

            // Agregar la tabla de plating o stiffeners
            doc.text(data.analysisType === 'Plating' ? "Plating" : "Stiffeners", 14, currentY);
            currentY += 3;
            doc.autoTable({
                head: platingStiffenersHead,
                body: platingStiffenersBody,
                startY: currentY,
                headStyles: {
                    fillColor: [85, 115, 89] // Color verde oscuro para el encabezado
                },
                styles: {
                    cellPadding: 1, 
                },
                columnStyles: {
                    0: { cellWidth: locationColumnWidth } // Usa la variable para el ancho
                },
                margin: { bottom: 30, top: 30 } // Ajusta el margen inferior a 35
            });

            doc.addImage(imageUrl, 'JPEG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);
    
        });
        
        doc.save('informe.pdf');
    }
    

    function saveGeneralData() {
        const generalData = {
            shipName: shipNameInput.value,
            doneBy: doneByInput.value,
            date: dateInput.value
        };
        localStorage.setItem('generalData', JSON.stringify(generalData));
    }

    [shipNameInput, doneByInput, dateInput].forEach(input => {
        input.addEventListener('change', saveGeneralData);
    });

    function loadGeneralData() {
        const generalData = JSON.parse(localStorage.getItem('generalData'));
        if (generalData) {
            shipNameInput.value = generalData.shipName || '';
            doneByInput.value = generalData.doneBy || '';
            dateInput.value = generalData.date || '';
        }
    }

    loadGeneralData();

    function saveTempFormData(Id, resultados) {
        const allTempData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
        let data = allTempData[Id] || {};
    
        const getValueOrDefault = (elementId, defaultValue, dataKey = elementId) => {
            const element = document.getElementById(elementId);
            return element ? element.value : (data[dataKey] || defaultValue);
        };
    
        const formData = {
            designCategory: getValueOrDefault('designCategory', ''),
            material: getValueOrDefault('material', ''),
            samplingZone: getValueOrDefault('samplingZone', ''),
            analysisType: getValueOrDefault('analysisType', ''),
            LH: getValueOrDefault('hullLength',0, 'LH'),
            LWL: getValueOrDefault('waterlineLength',0, 'LWL'),
            BWL: getValueOrDefault('waterlineBeam', 0, 'BWL'),
            BC: getValueOrDefault('chineBeam', 0, 'BC'),
            V: getValueOrDefault('maxSpeed', 0, 'V'),
            mLDC: getValueOrDefault('displacement', 0, 'mLDC'),
            B04: getValueOrDefault('deadRiseAngle', 0, 'B04'),
            fiberType: getValueOrDefault('fiberType', undefined),
            exteriorFiberType: getValueOrDefault('exteriorFiberType', undefined),
            interiorFiberType: getValueOrDefault('interiorFiberType', undefined),
            sandwichCoreType: getValueOrDefault('sandwichCoreType', undefined),
            b: getValueOrDefault('baseDimension', 0, 'b'),
            l: getValueOrDefault('longSide', 0, 'l'),
            x: getValueOrDefault('distanceFromStern', 0, 'x'),
            c: getValueOrDefault('panelCurvature', 0, 'c'),
            z : getValueOrDefault('deckHeight',0,'z'),
            hp : getValueOrDefault('panelCenterHeight',0,'hp'),
            hB: getValueOrDefault('columnHeight',0,'hB'),
            hs: getValueOrDefault('stiffenerCenterHeight',0,'ns'),
            etc: getValueOrDefault('modulusEtc', 0, 'etc'),
            tau: getValueOrDefault('tau', 0, 'tau'),
            s: getValueOrDefault('stiffenerSpacing', 0, 's'),
            lu: getValueOrDefault('unsupportedLength', 0, 'lu'),
            cu: getValueOrDefault('curvature', 0, 'cu'),
            sigmaCt: getValueOrDefault('sigmaCt', 0, 'sigmaCt'),
            sigmaUf: getValueOrDefault('ultimateFlexuralStrength', 0, 'sigmaUf'),
            sigmaU: getValueOrDefault('ultimateTensileStrength', 0, 'sigmaU'),
            sigmaY: getValueOrDefault('yieldTensileStrength', 0, 'sigmaY'),
            sigmaUt: getValueOrDefault('ultimateTensileStrengthOuterFiber', 0, 'sigmaUt'),
            sigmaUc: getValueOrDefault('ultimateCompressionStrengthInnerFiber', 0, 'sigmaUc'),
            eio: getValueOrDefault('averageYoungModulus', 0, 'eio'),
            tauU: getValueOrDefault('ultimateShearStrengthCore', 0, 'tauU'),
            resultados: resultados || {}
        };

        allTempData[Id] = formData;
        localStorage.setItem('temporaryFormData', JSON.stringify(allTempData));
    }

    function autoSaveFormData() {
        if (!currentCalculationRow) return;
        const calculationId = currentCalculationRow.cells[1].textContent || originalCalculationId;
        saveTempFormData(calculationId);
    };

    
    document.querySelectorAll('#calculationForm input, #calculationForm select').forEach(element => {
        element.addEventListener('change', autoSaveFormData);
    });
    
    function loadTempFormData(calculationId) {
        temporaryFormData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
        let data = temporaryFormData[calculationId];

        if (!data) {
            const keys = Object.keys(temporaryFormData);
            if (keys.length > 0) { 
                const lastCalculationId = keys[keys.length - 1];
                data = {...temporaryFormData[lastCalculationId]};
            } else { data = {} };


            data.designCategory = 'Seleccione una opción';
            data.material = 'Seleccione una opción';
            data.samplingZone = 'Seleccione una opción';
            data.analysisType = 'Seleccione una opción';
            data.fiberType = 'Seleccione una opción';
            data.exteriorFiberType = 'Seleccione una opción';
            data.interiorFiberType = 'Seleccione una opción';
            data.sandwichCoreType = 'Seleccione una opción';
            data.LH = data.LH ?? 0;
            data.LWL = data.LWL ?? 0;
            data.BWL = data.BWL ?? 0;
            data.BC = data.BC ?? 0;
            data.V = data.V ?? 0;
            data.mLDC = data.mLDC ?? 0;
            data.B04 = data.B04 ?? 0;
        }


        if (data) {
            document.getElementById('designCategory').value = data.designCategory || '';
            document.getElementById('material').value = data.material || '';
            document.getElementById('samplingZone').value = data.samplingZone || '';
            document.getElementById('analysisType').value = data.analysisType || '';
            document.getElementById('hullLength').value = data.LH || 0;
            document.getElementById('waterlineLength').value = data.LWL || 0;
            document.getElementById('waterlineBeam').value = data.BWL || 0;
            document.getElementById('chineBeam').value = data.BC || 0;
            document.getElementById('maxSpeed').value = data.V || 0;
            document.getElementById('displacement').value = data.mLDC || 0;
            document.getElementById('deadRiseAngle').value = data.B04 || 0;
            document.getElementById('fiberType').value = data.fiberType || '';
            document.getElementById('exteriorFiberType').value = data.exteriorFiberType || '';
            document.getElementById('interiorFiberType').value = data.interiorFiberType || '';
            document.getElementById('sandwichCoreType').value = data.sandwichCoreType || '';
            setupFormInteractions();
            currentSamplingZone = data.samplingZone || 'Seleccione una opción';
            updateImage();
        }
    }

    let originalCalculationId = null;
    
    function selectRow(newRow) {
        document.querySelectorAll('#calculationsTable tbody tr').forEach(row => {
            row.classList.remove('selected-row');
        });    
    
        newRow.classList.add('selected-row');
        selectedRow = newRow;
        currentCalculationRow = newRow;
        originalCalculationId = newRow.cells[1].textContent;
    
        isAddingNewCalculation = false;
    
        loadTempFormData(originalCalculationId);
    }
    
    function displayCalculationForm(calculationData = null, loadLastCalculation = false, id) {

        const displayArea = document.getElementById('calculationDisplay');
        displayArea.innerHTML = ''; 
       
        const formHtml = `
        <form id="calculationForm" class="row">
            <div class="col-12 d-flex justify-content-end mb-3">
                <button type="submit" id="nextButton" class="btn btn-sm" style="background-color: #3C402D; border-radius: 20px;">
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
                    <div class="form-group mb-2 d-none" id="fiberTypeContainer">
                        <label for="fiberType">Tipo de fibra de diseño:</label>
                        <select class="form-control" id="fiberType">
                            <option>Seleccione una opción</option>
                            <option>Fibra de vidrio E con filamentos cortados</option>
                            <option>Fibra de vidrio tejida</option>
                            <option>Fibra tejida de carbono, aramida(kevlar) o híbrida</option>
                        </select>
                    </div>
                    <div class="form-group mb-2 d-none" id="exteriorFiberTypeContainer">
                        <label for="exteriorFiberType">Tipo de fibra exterior:</label>
                        <select class="form-control" id="exteriorFiberType">
                            <option>Seleccione una opción</option>
                            <option>Fibra de vidrio E con filamentos cortados</option>
                            <option>Fibra de vidrio tejida</option>
                            <option>Fibra tejida de carbono, aramida(kevlar) o híbrida</option>
                        </select>
                    </div>

                    <!-- Contenedor para el input de "Tipo de fibra interior", oculto por defecto -->
                    <div class="form-group mb-2 d-none" id="interiorFiberTypeContainer">
                        <label for="interiorFiberType">Tipo de fibra interior:</label>
                        <select class="form-control" id="interiorFiberType">
                            <option>Seleccione una opción</option>
                            <option>Fibra de vidrio E con filamentos cortados</option>
                            <option>Fibra de vidrio tejida</option>
                            <option>Fibra tejida de carbono, aramida(kevlar) o híbrida</option>
                        </select>
                    </div>

                    <!-- Contenedor para el input de "Tipo de núcleo del sandwich", oculto por defecto -->
                    <div class="form-group mb-2 d-none" id="sandwichCoreTypeContainer">
                        <label for="sandwichCoreType">Tipo de núcleo del sandwich:</label>
                        <select class="form-control" id="sandwichCoreType">
                            <option>Seleccione una opción</option>
                            <option>Madera Balsa</option>
                            <option>Núcleo con elongación al corte en rotura < 35 % (PVC entrecruzado, etc.)</option>
                            <option>Núcleo con elongación al corte en rotura > 35 % (PVC lineal, SAN, etc.)</option>
                            <option>Núcleos tipo panal de abeja (compatibles con aplicaciones marinas)</option>
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
                        <input type="number" class="form-control" id="waterlineBeam" min="0" step="any">
                        <span id="waterlineBeamError" class="text-danger" style="display: none;">Error específico para BWL</span>
                    </div>
                    <div class="form-group mb-2">
                        <label for="chineBeam">Manga entre pantoques o 'chine' 'BC' (metros):</label>
                        <input type="number" class="form-control" id="chineBeam" min="0" step="any">
                        <span id="chineBeamError" class="text-danger" style="display: none;">Error específico para BC</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div style="height: 342px; overflow: hidden; text-align:center">
                        <img id="dynamicImage" src="static/img/BASE.png" class="img-fluid" alt="Imagen Descriptiva" style="object-fit: cover; height: 100%;">
                    </div>
                    <div class="form-group mb-2">
                        <label for="maxSpeed">Velocidad máxima 'V' (Nudos):</label>
                        <input type="number" class="form-control" id="maxSpeed" step="any">
                    </div>
                    <!-- Desplazamiento 'mLDC' -->
                    <div class="form-group mb-2">
                        <label for="displacement">Desplazamiento 'mLDC' (Kilogramos):</label>
                        <input type="number" class="form-control" id="displacement" min="0" step="any">
                        <span id="displacementError" class="text-danger" style="display: none;">Error específico para mLDC</span>
                    </div>
                    <!-- Ángulo de astilla muerta 'B04' -->
                    <div class="form-group mb-2">
                        <label for="deadRiseAngle">Ángulo de astilla muerta 'B04' en el LCG (°grados):</label>
                        <input type="number" class="form-control" id="deadRiseAngle" min="0" step="any">
                        <span id="deadRiseAngleError" class="text-danger" style="display: none;">Error específico para B04</span>
                    </div>
                </div>
            </form>`; 
        
        const newCalculationContainer = document.createElement('div');
        newCalculationContainer.classList.add('rounded', 'bg-white');
        newCalculationContainer.style.margin = '20px';
        newCalculationContainer.style.padding = '20px';
        newCalculationContainer.style.boxShadow = '0px 0px 10px #aaa';
        newCalculationContainer.style.minHeight = '200px';
        displayArea.style.overflowY = 'auto'; 
        displayArea.style.maxHeight = '91vh'; 
        
        newCalculationContainer.innerHTML = formHtml;
        displayArea.appendChild(newCalculationContainer);
        
        setupFormInteractions();

        const samplingZoneSelect = document.getElementById('samplingZone');
        samplingZoneSelect.addEventListener('change', updateImageBasedOnSamplingZone);

        const interactionFields = ['hullLength', 'waterlineLength', 'waterlineBeam'];
        interactionFields.forEach(fieldId => {
            const fieldElement = document.getElementById(fieldId);
            fieldElement.addEventListener('mouseenter', () => {
                lastInteractedField = fieldId;
                updateImage();
            });
            
            fieldElement.addEventListener('mouseleave', () => {
                lastInteractedField = null; 
                updateImage(); 
            });
        });
    }
    
    function updateImageBasedOnSamplingZone() {
        currentSamplingZone = document.getElementById('samplingZone').value;
        updateImage();
    }
    
    function updateImage() {
        const imageElement = document.getElementById('dynamicImage');
        const basePath = 'static/img/';
        let defaultImage = 'BASE.png'; // Imagen por defecto según el samplingZone seleccionado
    
        switch (currentSamplingZone) {
            case 'Seleccione una opción':
                defaultImage = 'BASE.png';
                break;
            case 'Fondo':
                defaultImage = 'FONDO.png';
                break;
            case 'Costados y Espejo':
                defaultImage = 'COSTADO.png';
                break;
            case 'Cubierta':
                defaultImage = 'CUBIERTA.png';
                break;
            case 'Superestructura':
                defaultImage = 'SUPERESTRUCT.png';
                break;
            case 'Mamparos estancos':
            case 'Mamparos de tanques integrales':
            case 'Mamparos de colisión':
                defaultImage = 'MAMPAROS.png';
                break;
        }
    
        let imagePath = basePath + defaultImage;
    
        if (lastInteractedField) {
            let interactionSuffix = '';
            switch (lastInteractedField) {
                case 'hullLength':
                    interactionSuffix = ' ECAS.png';
                    break;
                case 'waterlineLength':
                    interactionSuffix = ' EFLOT.PNG';
                    break;
                case 'waterlineBeam':
                    interactionSuffix = ' MANFLOT.PNG';
                    break;
            }
    
            // Actualiza la ruta de la imagen basada en la interacción
            imagePath = basePath + defaultImage.replace(/\.(png|PNG)$/, '') + interactionSuffix;
            
        }
    
        imageElement.src = imagePath;
    }
    
    function setupFormInteractions() {
        const temporaryFormData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
        const analysisTypeSelect = document.getElementById('analysisType');
        const samplingZoneSelect = document.getElementById('samplingZone');
        const materialSelect = document.getElementById('material');
        const hullLength = document.getElementById('hullLength');
        const waterlineLength = document.getElementById('waterlineLength');
        const maxSpeed = document.getElementById('maxSpeed');
        const fiberTypeContainer = document.getElementById('fiberTypeContainer');
        const exteriorFiberTypeContainer = document.getElementById('exteriorFiberTypeContainer');
        const interiorFiberTypeContainer = document.getElementById('interiorFiberTypeContainer');
        const sandwichCoreTypeContainer = document.getElementById('sandwichCoreTypeContainer');

        function updateMaterialOptions(selectedMaterial) {
            const analysisType = analysisTypeSelect.value;
            const options = [
                'Seleccione una opción',
                'Acero',
                'Aluminio',
                'Madera (laminada y plywood)',
                'Fibra laminada'
            ];
        
            // Añadir Fibra con núcleo (Sandwich) si el tipo de análisis no es 'Stiffeners'
            if (analysisType !== 'Stiffeners') {
                options.push('Fibra con nucleo (Sandwich)');
            }
        
            materialSelect.innerHTML = options.map(option => {
                const isSelected = option === selectedMaterial ? 'selected' : '';
                return `<option ${isSelected}>${option}</option>`;
            }).join('');
        
            updateFiberTypeVisibility();
        }
        
        analysisTypeSelect.addEventListener('change', () => updateMaterialOptions(materialSelect.value));
        
        // Llamada inicial para configurar las opciones de material
        updateMaterialOptions(materialSelect.value);

        function updateFiberTypeVisibility() {
            const material = materialSelect.value;
            
            const showFiberType = material === 'Fibra laminada';
            
            fiberTypeContainer.classList.toggle('d-none', !showFiberType);
            exteriorFiberTypeContainer.classList.toggle('d-none', material !== 'Fibra con nucleo (Sandwich)');
            interiorFiberTypeContainer.classList.toggle('d-none', material !== 'Fibra con nucleo (Sandwich)');
            sandwichCoreTypeContainer.classList.toggle('d-none', material !== 'Fibra con nucleo (Sandwich)');
        }
        
        materialSelect.addEventListener('change', updateFiberTypeVisibility);
    
        updateFiberTypeVisibility();
    
        function updateCalculationName() {
            // Obtén los valores actuales para construir el nuevo ID
            const analysisType = analysisTypeSelect.value !== 'Seleccione una opción' ? analysisTypeSelect.value : '';
            const samplingZone = samplingZoneSelect.value !== 'Seleccione una opción' ? samplingZoneSelect.value : '';
            const material = materialSelect.value !== 'Seleccione una opción' ? materialSelect.value : '';
            let baseCalculationName = `${analysisType} ${samplingZone} (${material})`;
            
            // Calcula el contador basado en entradas existentes
            let calculationCounter = 1;
            for (let id in temporaryFormData) {
                if (id.startsWith(baseCalculationName)) {
                    calculationCounter++;
                }
            }
            
            // Construye el nuevo nombre del cálculo con el contador actualizado
            let newCalculationId = `${baseCalculationName} ${calculationCounter}`;
        
            if (currentCalculationRow) {
                // Actualiza el nombre del cálculo en la fila seleccionada
                currentCalculationRow.cells[1].textContent = newCalculationId;
        
                if (originalCalculationId !== newCalculationId) {
                    if (temporaryFormData[originalCalculationId]) {
                        temporaryFormData[newCalculationId] = {...temporaryFormData[originalCalculationId]};
                        delete temporaryFormData[originalCalculationId];
                    } else {
                        temporaryFormData[newCalculationId] = {};
                    }
                    localStorage.setItem('temporaryFormData', JSON.stringify(temporaryFormData));
                    originalCalculationId = newCalculationId; // Actualiza el originalCalculationId con el nuevo ID
                }
        
                // Actualizar el data-id del botón de borrar para reflejar el nuevo ID
                currentCalculationRow.setAttribute('data-calc-id', newCalculationId); // Actualizar el atributo de la fila
                const deleteButton = currentCalculationRow.querySelector('.btn-delete');
                if (deleteButton) {
                    deleteButton.setAttribute('data-id', newCalculationId);
                }
            }
        }
        
        analysisTypeSelect.addEventListener('change', updateCalculationName);
        samplingZoneSelect.addEventListener('change', updateCalculationName);
        materialSelect.addEventListener('change', updateCalculationName);

        document.querySelectorAll('#calculationForm input, #calculationForm select').forEach(element => {
            element.removeEventListener('change', autoSaveFormData);
            element.addEventListener('change', autoSaveFormData);
        });
    
        // Ajusta los límites de LWL basado en el valor de LH
        const updateLWLBounds = () => {
            const lhValue = parseFloat(hullLength.value);
            waterlineLength.setAttribute('max', lhValue.toString());
            
        };
    
        hullLength.addEventListener('change', updateLWLBounds);
    
        // Ajusta el mínimo de velocidad máxima basado en el valor de LWL
        waterlineLength.addEventListener('change', () => {
            const lwlValue = parseFloat(waterlineLength.value);
            if (!isNaN(lwlValue)) {
                const minSpeed = 2.36 * Math.sqrt(lwlValue);
                maxSpeed.setAttribute('min', minSpeed.toFixed(2));
            }
        });
    
        // Esta función puede ser llamada al inicio si necesitas establecer mínimos iniciales basados en LWL cargado
        const updateMaxSpeedMin = () => {
            const lwlValue = parseFloat(waterlineLength.value);
            if (!isNaN(lwlValue)) {
                const minSpeed = 2.36 * Math.sqrt(lwlValue);
                maxSpeed.setAttribute('min', minSpeed.toFixed(2));
            }
        };
    
        // Llamada inicial para configurar el mínimo de velocidad máxima basado en el valor actual de LWL
        document.addEventListener('DOMContentLoaded', updateMaxSpeedMin);
    }
    
    document.addEventListener('DOMContentLoaded', loadUserCalculations);

    document.getElementById('addCalculation').addEventListener('click', function () {
        isAddingNewCalculation = true;
        displayCalculationForm(null, true);

        const allTempData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};

        // Encuentra el número más alto en los ID de cálculo existentes
        let maxNumber = 0;
        Object.keys(allTempData).forEach((key) => {
            const match = key.match(/Nuevo cálculo (\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNumber) {
                    maxNumber = num;
                }
            }
        });

        // Incrementa el contador basándose en el número más alto encontrado
        const calculationCount = maxNumber + 1;
        const newCalculationId = `Nuevo cálculo ${calculationCount}`;

        const tableBody = document.getElementById('calculationsTable').getElementsByTagName('tbody')[0];
        const newRow = tableBody.insertRow(0);
    
        // Celda para el checkbox
        const checkCell = newRow.insertCell(0);
        checkCell.innerHTML = `<input type="checkbox" class="calculation-select custom-checkbox" data-id="${newCalculationId}" />`;
    
        // Celda para el ID
        const cell1 = newRow.insertCell(1);
        cell1.textContent = newCalculationId;
        newRow.setAttribute('data-calc-id', newCalculationId); // Almacenar el ID actual en el atributo de la fila
        cell1.style.verticalAlign = "middle"; 
        
        // Celda para el botón de eliminar
        const deleteCell = newRow.insertCell(2);
        const deleteButtonHTML = `<button class="btn btn-delete" data-id="${newCalculationId}">X</button>`;
        deleteCell.innerHTML = deleteButtonHTML;
        deleteCell.classList.add("delete-cell");
        
        selectRow(newRow);
    
        attachFormSubmitListener();
    
        saveTempFormData(newCalculationId);
    
        newRow.addEventListener('click', function(e) {
            if (!e.target.classList.contains('btn-delete')) {
                selectRow(this);
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('btn-delete')) {
            const calculationId = e.target.getAttribute('data-id');
            Swal.fire({
                title: `¿Estás seguro de querer eliminar el cálculo "${calculationId}"?`,
                text: "¡No podrás revertir esto!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    deleteCalculation(calculationId);
                    Swal.fire(
                        '¡Eliminado!',
                        `El cálculo "${calculationId}" ha sido eliminado.`,
                        'success'
                    );
                }
            });
        }
    });
    
    function deleteCalculation(calculationId) {
        const tempFormDataString = localStorage.getItem('temporaryFormData');
        const temporaryFormData = tempFormDataString ? JSON.parse(tempFormDataString) : {};
    
        if (temporaryFormData.hasOwnProperty(calculationId)) {

            delete temporaryFormData[calculationId];
    
            localStorage.setItem('temporaryFormData', JSON.stringify(temporaryFormData));
    
            loadUserCalculations();
            selectedRow = null;
            originalCalculationId = null;
            const displayArea = document.getElementById('calculationDisplay');
            displayArea.innerHTML = '';
        } else {
            console.log("El ID proporcionado no existe en temporaryFormData:", calculationId);
        }
    }
    
    function attachFormSubmitListener() {
        const form = document.getElementById('calculationForm');
        if (form) {
            const selectElements = form.querySelectorAll('select');
    
            selectElements.forEach(select => {
                select.addEventListener('change', function() {
                    if (select.value === 'Seleccione una opción') {
                        select.setCustomValidity('Debe seleccionar una opción');
                    } else {
                        select.setCustomValidity(''); // Limpia la validación custom
                    }
                    select.reportValidity(); // Muestra el mensaje de validación si es necesario
                });
            });
    
            form.addEventListener('submit', function(event) {
                event.preventDefault(); // Previene el envío del formulario
    
                let isFormValid = true;
                selectElements.forEach(select => {
                    if (!select.closest('.form-group').classList.contains('d-none') && select.value === 'Seleccione una opción') {
                        isFormValid = false;
                        select.setCustomValidity('Debe seleccionar una opción');
                        select.reportValidity();
                    }
                });
    
                if (isFormValid) {
                    loadSecondForm();
                } 
            });
        }
    }
    
    

    function loadSecondForm() {
        const analysisType = document.getElementById('analysisType').value;
        const samplingZone = document.getElementById('samplingZone').value;
        const material = document.getElementById('material').value;
    
        // Genera el HTML del formulario basado en la selección
        const formHtml = generateFormBasedOnSelection(analysisType, samplingZone, material);
        
        // Prepara el área de visualización
        const displayArea = document.getElementById('calculationDisplay');
        displayArea.innerHTML = '';
    
        // Crea y configura el contenedor del nuevo formulario
        const newFormContainer = document.createElement('div');
        newFormContainer.classList.add('rounded', 'bg-white');
        newFormContainer.style.margin = '20px';
        newFormContainer.style.padding = '20px';
        newFormContainer.style.boxShadow = '0px 0px 10px #aaa';
        newFormContainer.style.minHeight = '200px';
        displayArea.style.overflowY = 'auto'; 
        displayArea.style.maxHeight = '90vh'; 
        newFormContainer.innerHTML = formHtml;
        displayArea.appendChild(newFormContainer);
        calculateAndUpdateTfinal();
    
        // Añade el evento click al botón "Volver" para cargar el formulario original
        const backButton = newFormContainer.querySelector('#backButton');
        if (backButton) {
            backButton.addEventListener('click', function() {
                const temporaryFormData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
                if (selectedRow) {
                    const calculationId = selectedRow.cells[1].textContent;
                    const calculationData = temporaryFormData[calculationId];
                    displayCalculationForm(calculationData,null,calculationId);
                    selectRow(selectedRow);
                    attachFormSubmitListener(); 
                }
            });
        }

        const downloadButton = document.getElementById('DownloadPdfButton');
        if (downloadButton) {
            downloadButton.addEventListener('click', function() {
                const tempFormData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
                const generalData = JSON.parse(localStorage.getItem('generalData')) || {};
                const calculationId = currentCalculationRow.cells[1].textContent;
                const data = tempFormData[calculationId];
                const resultados = data.resultados;
                const pressureData = resultados.pressure;

                let allDataAvailable = true;
                let missingDataMessage = '';
            
                if (
                    data.resultados === null ||
                    typeof data.resultados === 'undefined' ||
                    Object.keys(data.resultados).length === 0
                ) {
                    allDataAvailable = false;
                    missingDataMessage = `El cálculo ${calculationId} no se puede exportar debido a falta de información para los resultados.`;
                } else {
                    // Recorrer el diccionario de resultados para verificar si algún valor es null
                    for (const key in data.resultados) {
                        if (data.resultados[key] === null) {
                            allDataAvailable = false;
                            missingDataMessage = `El cálculo ${calculationId} no se puede exportar debido a falta de información para calcular ${key}.`;
                            break; // Salir del bucle tan pronto como se encuentre un valor null
                        }
                    }
                }

                if (!allDataAvailable) {
                    Swal.fire({
                        title: 'Error',
                        text: missingDataMessage,
                        icon: 'error',
                    });
                    return;
                } 

            const doc = new jsPDF();
            const type = (data.V / Math.sqrt(data.LWL)) < 5 ? 'Displacement' : 'Planning';
            const imageUrl = 'static/img/Fondo pdf.png'; // Ajusta esto a la ruta real o URL/base64
            doc.addImage(imageUrl, 'JPEG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);
            let infoRows = [
                ["Cat. Diseño", "Categoría de diseño", data.designCategory, ""],
                ["Material", "Material de escantillonado", data.material, ""],
                ["Tipo", "Tipo de embarcación", type, ""],
                ["Zona", "Zona de escantillonado", data.samplingZone, ""],
                ["LH", "Eslora del casco", data.LH, "m"],
                ["LWL", "Eslora en línea de flotación", data.LWL, "m"],
                ["BWL", "Manga en línea de flotación", data.BWL, "m"],
                ["BC", "Manga entre pantoques", data.BC, "m"],
                ["V", "Velocidad máxima de diseño", data.V, "nudos"],
                ["mLDC", "Desplazamiento de la embarcación", data.mLDC, "kg"],
                ["B04", "Astilla muerta de fondo", data.B04, "grados"]
            ];
                
            // Configura los encabezados de la tabla
            let generalTableHead = [['Acron', 'Descripción', 'Valor', 'Unidad']];
            
            // Usa 'infoRows' como el cuerpo de la tabla
            let generalTableBody = infoRows;                

            // Tabla de presión
            let pressureTableHead;
            let pressureTableBody = [];
            
            if (data.samplingZone === 'Superestructura') {
                // Añadir la columna "Unidad" en el encabezado
                pressureTableHead = [['Ubicación', 'KAR', 'KDC', 'KSUP', 'Presión', 'Unidad']];
                const pressureDetails = resultados.pressure.PSUP_M_values;
                const kSUP_values = resultados.pressure.kSUP_values;
            
                for (const location in pressureDetails) {
                    pressureTableBody.push([
                        location,
                        resultados.pressure.kAR.toFixed(5),
                        resultados.pressure.kDC.toFixed(5),
                        kSUP_values[location].toFixed(5),
                        pressureDetails[location].toFixed(5),
                        'MPa'  
                    ]);
                }
            } else {
                pressureTableHead = [['Sección', 'Valor', 'Unidad']];
                pressureTableBody = Object.entries(pressureData).map(([key, value]) => {
                    let unit = '';
                    if (key === 'Pressure') {
                        unit = 'MPa';  // Asumiendo que la unidad para presión es MPa
                    }
                    return [key, typeof value === 'number' ? value.toFixed(5) : value, unit];
                });
            }
        
            // Tabla de plating o stiffeners
            let platingStiffenersHead = [];
            let platingStiffenersBody = [];

            if (data.analysisType === 'Plating') {
                switch (data.material) {
                    case 'Acero':
                    case 'Aluminio':
                        if (data.samplingZone === 'Superestructura' && (data.material === 'Acero' || data.material === 'Aluminio')) {
                            platingStiffenersHead = [['Location', 'b', 'l', 'c', 'x', 'k2', 'kc',  'sigma uf',  'sigma d', 'Tfinal']];
                        
                            Object.entries(resultados).forEach(([location, result]) => {
                                if (location !== 'pressure') { 
                                    platingStiffenersBody.push([
                                        location,
                                        data.b,
                                        data.l,
                                        data.c,
                                        data.x,
                                        result.k2.toFixed(5),
                                        result.kC.toFixed(5),
                                        data.sigmaUf,
                                        result.sigmaD.toFixed(5),
                                        result.thickness.toFixed(5),
                                    ]);
                                }
                            });
                        
                        } else {
                            platingStiffenersHead = [['Property', 'Value']];
                            platingStiffenersBody = [
                                ['b (mm)', data.b],
                                ['l (mm)', data.l],
                                ['k2', resultados.k2.toFixed(5)],
                                ['x (m)', data.x],
                                ['c (mm)', data.c],
                                ['kc', resultados.kC.toFixed(5)],
                                ['Sigma u (MPa)', data.sigmaU],
                                ['Sigma y (MPa)', data.sigmaY],
                                ['Sigma d (MPa)', resultados.sigmaD.toFixed(5)],
                                ['tfinal (mm)', resultados.thickness.toFixed(5)]
                            ];
                        }
                        break;
                    case 'Madera (laminada y plywood)':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 'b', 'l', 'k2', 'x', 'Sigma Uf', 'Sigma D', 'Tfinal']];
                            Object.entries(resultados).forEach(([location, result]) => {
                                if (location !== 'pressure') {
                                    platingStiffenersBody.push([
                                        location,
                                        data.b + ' mm',
                                        data.l + ' mm',
                                        result.k2.toFixed(5),
                                        data.x + ' m',
                                        data.sigmaUf + ' MPa',
                                        result.sigmaD.toFixed(5) + ' MPa',
                                        result.thickness.toFixed(5) + ' mm'
                                    ]);
                                }
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['b', data.b, 'mm'],
                                ['l', data.l, 'mm'],
                                ['k2', resultados.k2.toFixed(5), ''],
                                ['x', data.x, 'm'],
                                ['Sigma uf', data.sigmaUf, 'MPa'],
                                ['Sigma d', resultados.sigmaD.toFixed(5), 'MPa'],
                                ['Tfinal', resultados.thickness.toFixed(5), 'mm']
                            ];
                        }
                        break; 
                    case 'Fibra laminada':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 'b (mm)', 'l (mm)', 'k2', 'x (m)', 'c (mm)', 'kc', 'Sigma uf', 'Sigma d', 'Tfinal']];
                            Object.entries(resultados).forEach(([location, result]) => {
                                if (location !== 'pressure') { // Excluimos el objeto de presión
                                    platingStiffenersBody.push([
                                        location,
                                        `${data.b} mm`,
                                        `${data.l} mm`,
                                        result.k2.toFixed(5),
                                        `${data.x} m`,
                                        `${data.c} mm`,
                                        result.kC.toFixed(5),
                                        `${data.sigmaUf} MPa`,
                                        `${result.sigmaD.toFixed(5)} MPa`,
                                        `${result.thickness.toFixed(5)} mm`
                                    ]);
                                }
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['b', data.b, 'mm'],
                                ['l', data.l, 'mm'],
                                ['k2', resultados.k2.toFixed(5), ''],
                                ['x', data.x, 'm'],
                                ['c', data.c, 'mm'],
                                ['kc', resultados.kC.toFixed(5), ''],
                                ['Sigma uf', data.sigmaUf, 'MPa'],
                                ['Sigma d', resultados.sigmaD.toFixed(5), 'MPa'],
                                ['Tfinal', resultados.thickness.toFixed(5), 'mm']
                            ];
                        }
                        break;
                    case 'Fibra con nucleo (Sandwich)':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 'b', 'l', 'k1', 'k2', 'k3', 'x', 'c', 'kc', 'Sigma UT', 'Sigma UC', 'Eio', 'Tau U', 'kSHC', 'Tfinal', 'Sigma DT', 'Sigma DC', 'Tau D', 'SM Inner', 'SM Outter', 'Second I', 'Wos', 'Wis']];
                            Object.keys(resultados).filter(zone => zone !== 'pressure').forEach(zone => {
                                let result = resultados[zone];
                                platingStiffenersBody.push([
                                    zone,
                                    `${data.b} mm`,
                                    `${data.l} mm`,
                                    result.k1.toFixed(3),
                                    result.k2.toFixed(3),
                                    result.k3.toFixed(3),
                                    `${data.x} m`,
                                    `${data.c} mm`,
                                    result.KC.toFixed(3),
                                    `${data.sigmaUt} MPa`,
                                    `${data.sigmaUc} MPa`,
                                    `${data.eio} MPa`,
                                    `${data.tauU} MPa`,
                                    result.kSHC.toFixed(3),
                                    `${result.thickness.toFixed(3)} mm`,
                                    `${result.sigma_dt.toFixed(3)} MPa`,
                                    `${result.sigma_dc.toFixed(3)} MPa`,
                                    `${result.tau_d.toFixed(3)} MPa`,
                                    `${result.SM_inner.toFixed(6)} mm³`,
                                    `${result.SM_outter.toFixed(6)} mm³`,
                                    `${result.second_I.toExponential(3)} mm⁴`,
                                    result.wos ? `${result.wos.toFixed(5)} g/m²` : 'N/A',
                                    result.wis ? `${result.wis.toFixed(5)} g/m²` : 'N/A'
                                ]);
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['b', data.b, 'mm'],
                                ['l', data.l, 'mm'],
                                ['k1', resultados.k1.toFixed(3), ''],
                                ['k2', resultados.k2.toFixed(3), ''],
                                ['k3', resultados.k3.toFixed(3), ''],
                                ['x', data.x, 'm'],
                                ['c', data.c, 'mm'],
                                ['kc', resultados.KC.toFixed(3), ''],
                                ['Sigma UT', data.sigmaUt, 'MPa'],
                                ['Sigma UC', data.sigmaUc, 'MPa'],
                                ['Eio', data.eio, 'MPa'],
                                ['Tau U', data.tauU, 'MPa'],
                                ['kSHC', resultados.kSHC.toFixed(3), ''],
                                ['Tfinal', resultados.thickness.toFixed(3), 'mm'],
                                ['Sigma DT', resultados.sigma_dt.toFixed(3), 'MPa'],
                                ['Sigma DC', resultados.sigma_dc.toFixed(3), 'MPa'],
                                ['Tau D', resultados.tau_d.toFixed(3), 'MPa'],
                                ['SM Inner', resultados.SM_inner.toFixed(6), 'mm³'],
                                ['SM Outter', resultados.SM_outter.toFixed(6), 'mm³'],
                                ['Second I', resultados.second_I.toExponential(3), 'mm⁴'],
                                ['Wos', resultados.wos ? resultados.wos.toFixed(5) : 'N/A', 'g/m²'],
                                ['Wis', resultados.wis ? resultados.wis.toFixed(5) : 'N/A', 'g/m²']
                            ];
                        }
                        break;
                    }
            } else { 
                switch (data.material) {
                    case 'Acero':
                    case 'Aluminio':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 's', 'lu', 'cu', 'x', 'KSA', 'sigma y', 'sigma d', 'tau d', 'SM', 'AW']];
                        
                            // Itera sobre los resultados para construir el cuerpo de la tabla
                            Object.entries(resultados.resultsAW).forEach(([location, awValue]) => {
                                let smValue = resultados.SM[location];
                                let sigmaD = resultados.sigmaD;
                                let tauD = resultados.tauD;
                                let kSA = resultados.kSA;
                        
                                // Asumiendo que `data.s`, `data.lu`, `data.cu`, `data.x` son valores globales
                                platingStiffenersBody.push([
                                    location,  // Ubicación
                                    data.s,  // s
                                    data.lu, // lu
                                    data.cu, // cu
                                    data.x,  // x
                                    kSA.toFixed(5),     // KSA
                                    data.sigmaY,  // sigma y
                                    sigmaD.toFixed(5),  // sigma d
                                    tauD.toFixed(5),    // tau d
                                    `${smValue.toExponential(5)}`,
                                    `${awValue.toExponential(5)}`
                                ]);
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['S', data.s, ''],
                                ['Cu', data.cu, ''],
                                ['kSA', resultados.kSA, ''],
                                ['Lu', data.lu, 'm'],
                                ['X', data.x, 'm'],
                                ['Sigma Y', data.sigmaY, 'MPa'],
                                ['Sigma D', resultados.sigmaD, 'MPa'],
                                ['Tau D', resultados.tauD, 'MPa'],
                                ['AW', resultados.AW, ''],
                                ['SM', resultados.SM, 'mm³']
                            ];
                        }
                        break;                        
                    case 'Madera (laminada y plywood)':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 's', 'lu', 'cu', 'x', 'KSA', 'sigma uf', 'sigma d', 'tau', 'tau d', 'SM', 'AW']];
                        
                            Object.entries(resultados.resultsAW).forEach(([location, awValue]) => {
                                let smValue = resultados.SM[location];
                                let sigmaD = resultados.sigmaD;
                                let tauD = resultados.tauD;
                                let kSA = resultados.kSA;
                    
                                platingStiffenersBody.push([
                                    location,  
                                    data.s, 
                                    data.lu,
                                    data.cu, 
                                    data.x, 
                                    kSA.toFixed(5), 
                                    data.sigmaUf, 
                                    sigmaD.toFixed(5),
                                    data.tau,  
                                    tauD.toFixed(5), 
                                    `${smValue.toExponential(5)}`,
                                    `${awValue.toExponential(5)}`
                                ]);
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['S', data.s, ''],
                                ['Lu', data.lu, 'm'],
                                ['Cu', data.cu, ''],
                                ['X', data.x, 'm'],
                                ['kSA', resultados.kSA, ''],
                                ['Sigma UF', data.sigmaUf.toFixed(5), 'MPa'],
                                ['Sigma D', resultados.sigmaD.toFixed(5), 'MPa'],
                                ['Tau', data.tau.toFixed(5), ''],
                                ['Tau D', resultados.tauD.toFixed(5), 'MPa'],
                                ['SM', resultados.SM.toFixed(5), 'mm³'],
                                ['AW', resultados.AW.toFixed(5), '']
                            ];
                        }
                        break;
                    case 'Fibra laminada':
                        if (data.samplingZone === 'Superestructura') {
                            platingStiffenersHead = [['Ubicación', 's', 'lu', 'cu', 'x', 'KSA', 'sigma ct', 'sigma d', 'tau', 'tau d', 'I', 'SM', 'AW']];
                        
                            Object.entries(resultados.resultsAW).forEach(([location, awValue]) => {
                                let smValue = resultados.SM[location];
                                let sigmaD = resultados.sigmaD;
                                let tauD = resultados.tauD;
                                let kSA = resultados.kSA;
                                let I = resultados.I[location]
                    
                                platingStiffenersBody.push([
                                    location,  
                                    data.s, 
                                    data.lu,
                                    data.cu, 
                                    data.x, 
                                    kSA.toFixed(5), 
                                    data.sigmaCt, 
                                    sigmaD.toFixed(5),
                                    data.tau,  
                                    tauD.toFixed(5), 
                                    `${I.toExponential(5)}`,
                                    `${smValue.toExponential(5)}`,
                                    `${awValue.toExponential(5)}`,
                                ]);
                            });
                        } else {
                            platingStiffenersHead = [['Propiedad', 'Valor', 'Unidad']];
                            platingStiffenersBody = [
                                ['S', data.s, ''],
                                ['Lu', data.lu, 'm'],
                                ['Cu', data.cu, ''],
                                ['X', data.x, 'm'],
                                ['kSA', resultados.kSA, ''],
                                ['Sigma ct', data.sigmaCt, 'MPa'],
                                ['Sigma D', resultados.sigmaD.toFixed(5), 'MPa'],
                                ['Tau', data.tau, ''],
                                ['Tau D', resultados.tauD.toFixed(5), 'MPa'],
                                ['I', resultados.I, ''],
                                ['SM', resultados.SM.toFixed(5), 'mm³'],
                                ['AW', resultados.AW.toFixed(5), '']
                            ];
                        }
                        break;
                }
                    
            }

            function filterAcronyms() {
                var acronymsToShow = [];
                var analysisType = data.analysisType;
                var material = data.material;
                var samplingZone = data.samplingZone;
                
                if (samplingZone === 'Fondo') {
                    acronymsToShow = ['Kar', 'Kl', 'Kdc'];
                } else if (samplingZone === 'Costados y Espejo') {
                    acronymsToShow = ['Kz', 'Kar', 'Kl', 'Kdc'];
                } else if (samplingZone === 'Cubierta') {
                    acronymsToShow = ['Kar', 'Kdc', 'Kl'];
                } else if (samplingZone === 'Superestructura') {
                    acronymsToShow = ['Kar', 'Kdc', 'Ksup'];
                } else if (samplingZone === 'Mamparos estancos' || samplingZone === 'Mamparos de tanques integrales' || samplingZone === 'Mamparos de colisión') {
                    acronymsToShow = ['Hb'];
                } 
                
                
                if (analysisType === 'Plating') {
                    if (material === 'Acero' || material === 'Aluminio') {
                    acronymsToShow.push('b', 'l', 'k2', 'x', 'c', 'kc', 'Sigma u', 'sigma y', 'sigma d', 'T final');
                    } else if (material === 'Madera (laminada y plywood)') {
                    acronymsToShow.push('b', 'l', 'k2', 'x', 'sigma uf', 'sigma d', 'T final');
                    } else if (material === 'Fibra laminada') {
                    acronymsToShow.push('b', 'l', 'k2', 'x', 'c', 'kc', 'sigma uf', 'sigma d', 'T final');
                    } else if (material === 'Fibra con nucleo (Sandwich)') {
                    acronymsToShow.push('b', 'l', 'k2', 'x', 'c', 'kc', 'sigma ut', 'sigma uc', 'eio', 'tau', 'k3', 'k1', 'T final', 'sigma dt', 'sigma dc', 'tau d', 'sm inner', 'sm outter', 'second I', 'wos', 'wis');
                    }
                }
                
                if (analysisType === 'Stiffeners') {
                    acronymsToShow.push('s', 'cu', 'ksa', 'lu', 'x');
                    if (material === 'Acero' || material === 'Aluminio') {
                    acronymsToShow.push('sigma y', 'sigma d', 'tau d', 'AW', 'SM');
                    } else if (material === 'Madera (laminada y plywood)') {
                    acronymsToShow.push('tau', 'tau d', 'sigma uf', 'sigma d', 'AW', 'sm');
                    } else if (material === 'Fibra laminada') {
                    acronymsToShow.push('tau', 'tau d', 'sigma ct', 'sigma d', 'AW', 'sm', 'I');
                    }
                }
                
                return acronymsToShow;
                }

            var acronymsToShow = filterAcronyms();
            var filteredData = dataAcron.filter(item => acronymsToShow.includes(item.acronym));

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);  
            doc.setTextColor(85, 115, 89);


            doc.text(`Embarcación: ${generalData.shipName || ''}`, 14, 28);
            doc.text(`Realizado por: ${generalData.doneBy || ''}`, 14, 34);
            doc.text(`Fecha: ${generalData.date || ''}`, 14, 40);


            doc.text("Información General", 14, 56);
            doc.autoTable({
                head: generalTableHead,
                body: generalTableBody,
                startY: 60,
                headStyles: {
                    fillColor: [85, 115, 89]  // RGB equivalent of #557359
                }, styles: {
                    cellPadding: 1, 
                }
            });

            let currentY = doc.lastAutoTable.finalY + 8;

            doc.text("Información Especifica", 14, currentY);
            doc.autoTable({
                head: [['Acrónimo', 'Descripción']],
                body: filteredData.map(item => [item.acronym, item.label]),
                startY: currentY + 4,
                headStyles: {
                    fillColor: [85, 115, 89]  
                }, styles: {
                    cellPadding: 1, 
                },
                margin: { bottom: 30, top: 30 }
            });

            currentY = doc.lastAutoTable.finalY + 8;
    
            // Agregar la tabla de presión al PDF
            doc.text("Presión", 14, currentY);
            currentY += 3;
            doc.autoTable({
                head: pressureTableHead,
                body: pressureTableBody,
                startY: currentY,
                headStyles: {
                    fillColor: [85, 115, 89]  // RGB equivalent of #557359
                }, styles: {
                    cellPadding: 1, 
                }
            });
    
            currentY = doc.lastAutoTable.finalY + 8;
    
            // Determinar el ancho de la columna de ubicación basado en el número total de columnas
            let totalColumns = platingStiffenersHead[0].length;
            let locationColumnWidth = totalColumns > 5 ? 40 : 30; // Aumentar el ancho si hay muchas columnas

            // Agregar la tabla de plating o stiffeners
            doc.text(data.analysisType === 'Plating' ? "Plating" : "Stiffeners", 14, currentY);
            currentY += 3;
            doc.autoTable({
                head: platingStiffenersHead,
                body: platingStiffenersBody,
                startY: currentY,
                headStyles: {
                    fillColor: [85, 115, 89] // Color verde oscuro para el encabezado
                },
                styles: {
                    cellPadding: 1, 
                },
                columnStyles: {
                    0: { cellWidth: locationColumnWidth } // Usa la variable para el ancho
                },
                margin: { bottom: 30, top: 30 } // Ajusta el margen inferior a 35
            });

            doc.addImage(imageUrl, 'JPEG', 0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height);
    
            // Guardar el PDF
            doc.save('informe.pdf');
                });

        }
        
        assignEventListenersToForm();
    }

    function loadUserCalculations() {
        const tempData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
        const tableBody = document.getElementById('calculationsTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = '';
    
        const tempDataKeys = Object.keys(tempData);
        
        // Recorre los cálculos en orden inverso para que el más reciente esté arriba
        tempDataKeys.forEach((id) => {
            const calculation = tempData[id];
            const row = tableBody.insertRow(0); // Inserta al principio de la tabla
    
            // Celda para la casilla de verificación
            const checkCell = row.insertCell(0);
            checkCell.innerHTML = `<input type="checkbox" class="calculation-select custom-checkbox" data-id="${id}" />`;
    
            // Celda para el ID
            const cell = row.insertCell(1);
            cell.textContent = id;
            cell.style.verticalAlign = "middle"; // Alinea verticalmente el texto al centro
    
            // Celda para el botón de eliminar
            const deleteCell = row.insertCell(2);
            const deleteButtonHTML = `<button class="btn btn-delete" data-id="${id}">X</button>`; 
            deleteCell.innerHTML = deleteButtonHTML;
            deleteCell.classList.add("delete-cell"); 
    
            row.addEventListener('click', function(e) {
                if (e.target.classList.contains('btn-delete')) return; 
                displayCalculationForm(calculation);
                attachFormSubmitListener(); 
                selectRow(row);
            });
        });
    
        const selectAllCheckbox = document.getElementById('selectAllCalculations');
        selectAllCheckbox.addEventListener('change', function() {
            document.querySelectorAll('.calculation-select').forEach(checkBox => {
                checkBox.checked = this.checked;
            });
        });
    }
    

    function generateFormBasedOnSelection(analysisType, zonaEscantillonado, material) {
        const calculationId = currentCalculationRow.cells[1].textContent 
        const allTempData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
        data = allTempData[calculationId];
        let formFields = ``;
        const waterColumnHeightZones = ['Mamparos de colisión', 'Mamparos de tanques integrales', 'Mamparos estancos'];

    let resultFields = `
        <div style="margin-top: 5px">
        ${zonaEscantillonado !== 'Superestructura' ? `
            <div class="d-flex justify-content-between align-items-center" style="margin-top: 40px">
                <label for="tFinalDisplay" class="form-label" style="width: 70%;">Espesor final calculado (mm)</label>
                <input type="text" class="form-control form-control-sm" id="tFinalDisplay" name="tFinalDisplay" readonly style="width: 30%;">
            </div>
        ` : ''}  
        ${material === 'Fibra laminada' && (zonaEscantillonado === 'Fondo' || zonaEscantillonado === 'Costados y Espejo' || zonaEscantillonado === 'Cubierta') ? `
            <div class="d-flex justify-content-between align-items-center">
                <label for="wMinDisplay" class="form-label" style="width: 70%;">Espesor mínimo (mm)</label>
                <input type="text" class="form-control form-control-sm" id="wMinDisplay" name="wMinDisplay" readonly style="width: 30%;">
            </div>
        ` : ''}                                                           
        ${material === 'Fibra con nucleo (Sandwich)' && zonaEscantillonado !== 'Superestructura' && !waterColumnHeightZones.includes(zonaEscantillonado) ? `
        <div class="d-flex justify-content-between align-items-center">
            <label for="wMinDisplay" class="form-label" style="width: 70%;">Espesor mínimo (mm)</label>
            <input type="text" class="form-control form-control-sm" id="wMinDisplay" name="wMinDisplay" readonly style="width: 30%;">
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <label for="WosDisplay" class="form-label" style="width: 70%;">Wos calculado</label>
            <input type="text" class="form-control form-control-sm" id="WosDisplay" name="WosDisplay" readonly style="width: 30%;">
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <label for="WisDisplay" class="form-label" style="width: 70%;">Wis calculado</label>
            <input type="text" class="form-control form-control-sm" id="WisDisplay" name="WisDisplay" readonly style="width: 30%;">
        </div>
    ` : ''}
    ${material === 'Fibra con nucleo (Sandwich)' && zonaEscantillonado !== 'Superestructura' ? `
        <div class="d-flex justify-content-between align-items-center">
            <label for="SMInnerDisplay" class="form-label" style="width: 70%;">SM interior calculado</label>
            <input type="text" class="form-control form-control-sm" id="SMInnerDisplay" name="SMInnerDisplay" readonly style="width: 30%;">
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <label for="SMOuterDisplay" class="form-label" style="width: 70%;">SM exterior calculado</label>
            <input type="text" class="form-control form-control-sm" id="SMOuterDisplay" name="SMOuterDisplay" readonly style="width: 30%;">
        </div>
        <div class="d-flex justify-content-between align-items-center">
            <label for="SecondIDisplay" class="form-label" style="width: 70%;">Momento de inercia calculado</label>
            <input type="text" class="form-control form-control-sm" id="SecondIDisplay" name="SecondIDisplay" readonly style="width: 30%;">
        </div>
    ` : ''}
        ${material === 'Fibra con nucleo (Sandwich)' && zonaEscantillonado === 'Superestructura' ? `
        <div>
            <h5>Resultados para Superestructura</h5>
            <table class="table table-bordered table-sm" style="font-size: 14px;">
                <thead>
                    <tr>
                        <th>Ubicación</th>
                        <th>Espesor (mm)</th>
                        <th>SM Interior</th>
                        <th>SM Exterior</th>
                        <th>Momento de Inercia</th>
                    </tr>
                </thead>
                <tbody id="superstructureResults">
                    <!-- Los resultados se insertarán dinámicamente aquí -->
                </tbody>
            </table>
        </div>
    ` : ''}
    ${material !== 'Fibra con nucleo (Sandwich)' && zonaEscantillonado === 'Superestructura' ? `
        <div>
            <h5>Resultados para Superestructura</h5>
            <table class="table table-bordered table-sm" style="font-size: 14px;">
                <thead>
                    <tr>
                        <th scope="col">Zona</th>
                        <th scope="col">Valor</th>
                    </tr>
                </thead>
                <tbody id="superstructureResults">
                    <!-- Los resultados se insertarán dinámicamente aquí -->
                </tbody>
            </table>
        </div>
    ` : ''}

    </div>
    `;

    let curvatureField = `
    <div class="form-group row align-items-center">
        <label for="panelCurvature" class="col-sm-9 col-form-label">Ingrese la corona o curvatura del panel 'c' (mm):</label>
        <div class="col-sm-3">
            <input type="number" class="form-control" id="panelCurvature" name="c" value="${data.c || 0}">
        </div>
    </div>
    `;

    if (analysisType === 'Plating') {

        let baseFields = `
        <div class="form-group row align-items-center" >
            <label for="baseDimension" class="col-sm-9 col-form-label">Ingrese la dimensión más corta o base del panel de la lamina 'b' (mm):</label>
            <div class="col-sm-3">
                <input type="number" class="form-control" id="baseDimension" name="b" value="${data.b || 0}">
            </div>
        </div>
        <div class="form-group row align-items-center">
            <label for="longSide" class="col-sm-9 col-form-label">Digite el lado más largo del panel de la lamina 'l' (mm):</label>
            <div class="col-sm-3">
                <input type="number" class="form-control" id="longSide" name="l" value="${data.l || 0}">
            </div>
        </div>
        `;

        formFields += baseFields;

        if (material !== 'Madera (laminada y plywood)') {
            formFields += curvatureField;
        }

    }  else if (analysisType === 'Stiffeners') {
        let baseFields = `
        <div class="form-group row align-items-center">
            <label for="stiffenerSpacing" class="col-sm-9 col-form-label">Ingrese la separación entre refuerzos 's' (mm):</label>
            <div class="col-sm-3">
                <input type="number" class="form-control" id="stiffenerSpacing" name="s" value="${data.s || 0}">
            </div>
        </div>
        <div class="form-group row align-items-center">
            <label for="unsupportedLength" class="col-sm-9 col-form-label">Ingrese la longitud no soportada de los refuerzos 'lu' (mm):</label>
            <div class="col-sm-3">
                <input type="number" class="form-control" id="unsupportedLength" name="lu" value="${data.lu || 0}">
            </div>
        </div>
        <div class="form-group row align-items-center">
            <label for="curvature" class="col-sm-9 col-form-label">Ingrese la corona o curvatura si el refuerzo es curvo 'cu' (mm):</label>
            <div class="col-sm-3">
                <input type="number" class="form-control" id="curvature" name="cu" value="${data.cu || 0}">
            </div>
        </div>
        `;

        formFields += baseFields;
    }


    let distanceFromSternField = `
        <div class="form-group row align-items-center">
            <label for="distanceFromStern" class="col-sm-9 col-form-label">Distancia desde popa hasta el centro del panel o refuerzo 'x' (metros):</label>
            <div class="col-sm-3">
                <input type="number" class="form-control" id="distanceFromStern" name="x" value="${data.x || 0}">
            </div>
        </div>
        `;
        
    if (zonaEscantillonado !== 'superstructures_deckhouses') {
        formFields += distanceFromSternField;
    }
    

    // Actualizando identificadores y nombres de entrada basados en el material
    let flexuralStrengthLabel, flexuralStrengthId;
    if (material === 'Madera (laminada y plywood)') {
        flexuralStrengthLabel = "Ingrese la resistencia ultima a la flexión de la Madera (laminada y plywood) paralela al lado corto del panel: ";
        flexuralStrengthId = "ultimateFlexuralStrength";
    } else {
        flexuralStrengthLabel = "Ingrese la resistencia ultima a la flexión:";
        flexuralStrengthId = "ultimateFlexuralStrength";
    }

    let tensileStrengthLabel = `Ingrese el esfuerzo último a la tracción del ${material}:`;
    let tensileStrengthId = "ultimateTensileStrength";

    let yieldStrengthLabel = `Ingrese el esfuerzo de fluencia a la tracción del ${material}:`;
    let yieldStrengthId = "yieldTensileStrength";

    let tensileStrengthOuterFiberLabel = "Ingrese el esfuerzo último a la tracción de la fibra externa:";
    let tensileStrengthOuterFiberId = "ultimateTensileStrengthOuterFiber";

    let compressionStrengthInnerFiberLabel = "Ingrese el esfuerzo último a la compresión de la fibra interna:";
    let compressionStrengthInnerFiberId = "ultimateCompressionStrengthInnerFiber";

    let averageYoungModulusLabel = "Ingrese el promedio de los módulos de Young de las caras interna y externa (MPa):";
    let averageYoungModulusId = "averageYoungModulus";

    let ultimateShearStrengthCoreLabel = "Ingrese el esfuerzo último al cortante del núcleo:";
    let ultimateShearStrengthCoreId = "ultimateShearStrengthCore";

    // Construyendo campos específicos de material
    switch (material) {
        case 'Fibra laminada':
            formFields +=  `
                <div class="form-group row align-items-center">
                    <label for="${flexuralStrengthId}" class="col-sm-9 col-form-label">${flexuralStrengthLabel}</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="${flexuralStrengthId}" name="sigma_uf" value="${data.sigmaUf || 0}">
                    </div>
                </div>
            `;
            if (analysisType === 'Stiffeners') {
                formFields += `
                    <div class="form-group row align-items-center">
                        <label for="modulusEtc" class="col-sm-9 col-form-label">Ingrese el promedio del módulo de compresión y de tensión de la Fibra laminada para el refuerzo:</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="modulusEtc" name="etc" value="${data.etc || 0}">
                        </div>
                    </div>
                    <div class="form-group row align-items-center">
                        <label for="tau" class="col-sm-9 col-form-label">Ingrese la resistencia última mínima al cortante de la Fibra laminada para el refuerzo:</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="tau" name="tau" value="${data.tau || 0}">
                        </div>
                    </div>
                    <div class="form-group row align-items-center">
                        <label for="sigmaCt" class="col-sm-9 col-form-label">Ingrese esfuerzo último (compresión o tracción) de la Fibra laminada según el tipo de carga presente en el refuerzo:</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="sigmaCt" name="sigmaCt" value="${data.sigmaCt || 0}">
                        </div>
                    </div>
                `;
            }
            break;
        case 'Acero':
        case 'Aluminio':
            formFields +=  `
                <div class="form-group row align-items-center">
                    <label for="${tensileStrengthId}" class="col-sm-9 col-form-label">${tensileStrengthLabel}</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="${tensileStrengthId}" name="sigma_u" value="${data.sigmaU || 0}">
                    </div>
                </div>
                <div class="form-group row align-items-center">
                    <label for="${yieldStrengthId}" class="col-sm-9 col-form-label">${yieldStrengthLabel}</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="${yieldStrengthId}" name="sigma_y" value="${data.sigmaY || 0}">
                    </div>
                </div>
            `;
            break;
        case 'Madera (laminada y plywood)':
            if (analysisType === 'Stiffeners') {
                formFields += `
                    <div class="form-group row align-items-center">
                        <label for="tau" class="col-sm-9 col-form-label">Ingrese la resistencia última al cortante de la Madera (laminada y plywood) para el refuerzo:</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="tau" name="tau" value="${data.tau || 0}">
                        </div>
                    </div>
                `;
            }
            formFields += `
                <div class="form-group row align-items-center">
                    <label for="${flexuralStrengthId}" class="col-sm-9 col-form-label">${flexuralStrengthLabel}</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="${flexuralStrengthId}" name="sigma_uf" value="${data.sigmaUf || 0}">
                    </div>
                </div>
            `;
            break;
        case 'Fibra con nucleo (Sandwich)':
            formFields += `
                <div class="form-group row align-items-center">
                    <label for="${tensileStrengthOuterFiberId}" class="col-sm-9 col-form-label">${tensileStrengthOuterFiberLabel}</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="${tensileStrengthOuterFiberId}" name="sigma_ut_ext" value="${data.sigmaUt || 0}">
                    </div>
                </div>
                <div class="form-group row align-items-center">
                    <label for="${compressionStrengthInnerFiberId}" class="col-sm-9 col-form-label">${compressionStrengthInnerFiberLabel}</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="${compressionStrengthInnerFiberId}" name="sigma_uc_int" value="${data.sigmaUc || 0}">
                    </div>
                </div>
                <div class="form-group row align-items-center">
                    <label for="${averageYoungModulusId}" class="col-sm-9 col-form-label">${averageYoungModulusLabel}</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="${averageYoungModulusId}" name="E_avg" value="${data.eio || 0}">
                    </div>
                </div>
                <div class="form-group row align-items-center">
                    <label for="${ultimateShearStrengthCoreId}" class="col-sm-9 col-form-label">${ultimateShearStrengthCoreLabel}</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="${ultimateShearStrengthCoreId}" name="tau_uc" value="${data.tauU || 0}">
                    </div>
                </div>
            `;

            if (analysisType === 'Stiffeners') {
                formFields += `
                    <div class="form-group row align-items-center">
                        <label for="modulusEtc" class="col-sm-9 col-form-label">Ingrese el promedio del módulo de compresión y de tensión de la Fibra laminada para el refuerzo:</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="modulusEtc" name="etc" value="${data.etc || 0}">
                        </div>
                    </div>
                    <div class="form-group row align-items-center">
                        <label for="tau" class="col-sm-9 col-form-label">Ingrese la resistencia última mínima al cortante de la Fibra laminada para el refuerzo:</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="tau" name="tau" value="${data.tau || 0}">
                        </div>
                    </div>
                    <div class="form-group row align-items-center">
                        <label for="sigmaCt" class="col-sm-9 col-form-label">Ingrese esfuerzo último (compresión o tracción) de la Fibra laminada según el tipo de carga presente en el refuerzo:</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="sigmaCt" name="sigmaCt" value="${data.sigmaCt || 0}">
                        </div>
                    </div>
                `;
            }
            break;
        }

        let additionalFields = '';

        if (zonaEscantillonado === 'Costados y Espejo') {
            additionalFields += `
                <div class="form-group row align-items-center">
                    <label for="deckHeight" class="col-sm-9 col-form-label">Ingrese la altura de la cubierta, medida desde la línea de flotación (metros):</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="deckHeight" name="deckHeight" value="${data.z || 0}">
                    </div>
                </div>
            `;
            if (analysisType === 'Plating') {
                additionalFields += `
                    <div class="form-group row align-items-center">
                        <label for="panelCenterHeight" class="col-sm-9 col-form-label">Ingrese la altura del centro del panel por encima de la línea de flotación (metros):</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="panelCenterHeight" name="hp" value="${data.hp || 0}">
                        </div>
                    </div>
                `;
            } else if (analysisType === 'Stiffeners') {
                additionalFields += `
                    <div class="form-group row align-items-center">
                        <label for="stiffenerCenterHeight" class="col-sm-9 col-form-label">Ingrese la altura del centro del refuerzo por encima de la línea de flotación (metros):</label>
                        <div class="col-sm-3">
                            <input type="number" class="form-control" id="stiffenerCenterHeight" name="hs" value="${data.hs || 0}">
                        </div>
                    </div>
                `;
            }
        }
        
        if (waterColumnHeightZones.includes(zonaEscantillonado)) {
            additionalFields += `
                <div class="form-group row align-items-center">
                    <label for="columnHeight" class="col-sm-9 col-form-label">Ingrese la altura de la columna de agua (en metros):</label>
                    <div class="col-sm-3">
                        <input type="number" class="form-control" id="columnHeight" name="hB" value="${data.hB || 0}">
                    </div>
                </div>
            `;
        }
        
        
        formFields += additionalFields;
        
        let formHtml = `
        <div class="row">
            <div class="col-md-12 d-flex justify-content-between mb-3">
                <button type="button" id="backButton" class="btn btn-sm" style="background-color: #3C402D; border-radius: 20px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" class="bi bi-arrow-left" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M15 8a.5.5 0 0 0-.5-.5H2.707l3.147-3.146a.5.5 0 1 0-.708-.708l-4 4a.5.5 0 0 0 0 .708l4 4a.5.5 0 0 0 .708-.708L2.707 8.5H14.5A.5.5 0 0 0 15 8"/>
                    </svg>
                    <span style="color: white;">Volver</span>
                </button>
                <button type="button" id="DownloadPdfButton" class="btn btn-sm" style="background-color: #3C402D; border-radius: 50%;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="26" fill="white" class="bi bi-file-earmark-arrow-down" viewBox="0 0 16 16">
                    <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293z"/>
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
                    </svg>
                </button>
            </div>
            <div class="col-md-6">
                <div style="height: 300px; overflow: hidden;">
                    <img src="static/img/arriba.png" height="100%" style="object-fit: contain; width: 100%;" alt="Image 1">
                </div>
                ${formFields}
            </div>
            <div class="col-md-6">
                <div style="height: 300px; overflow: hidden;">
                    <img src="static/img/abajo.png" height="100%" style="object-fit: contain; width: 100%;" alt="Image 2">
                </div>
                ${resultFields}
            </div>
        </div>
    `;

        
        return formHtml;
        
    }

    function calculateAndUpdateTfinal() {

        function updateSuperstructureResultsSandwich(results) {
            const resultsBody = document.getElementById('superstructureResults');
            resultsBody.innerHTML = ''; // Limpiar los resultados anteriores
        
            for (const [location, data] of Object.entries(results)) {
                const row = `<tr>
                    <td>${location}</td>
                    <td>${data.Thickness.toFixed(4)}</td>
                    <td>${data.SM_Inner.toExponential(4)}</td>
                    <td>${data.SM_Outter.toExponential(4)}</td>
                    <td>${data.Second_Moment_of_Area.toExponential(4)}</td>
                </tr>`;
                resultsBody.innerHTML += row;
            }
        }

        function updateSuperstructureResults(results) {
            const resultsBody = document.getElementById('superstructureResults');
            resultsBody.innerHTML = ''; // Limpiar los resultados anteriores
        
            // Iterar sobre los resultados y agregar filas a la tabla
            for (const [zona, valor] of Object.entries(results)) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${zona}</td>
                    <td>${valor}</td>
                `;
                resultsBody.appendChild(row);
            }
        }

        const calculationId = currentCalculationRow.cells[1].textContent 

        const allTempData = JSON.parse(localStorage.getItem('temporaryFormData')) || {};
        data = allTempData[calculationId];
        const { designCategory, analysisType, samplingZone, material, BC, B04, mLDC, LH,  V, BWL, LWL, fiberType, exteriorFiberType, interiorFiberType, sandwichCoreType } = data;

        let b = parseFloat(document.getElementById('baseDimension')?.value) || 0;
        const l = parseFloat(document.getElementById('longSide')?.value) || 0;
        const x = parseFloat(document.getElementById('distanceFromStern')?.value) || 0;
        const c = parseFloat(document.getElementById('panelCurvature')?.value) || 0;
        const z = parseFloat(document.getElementById('deckHeight')?.value) || 0;
        const hp = parseFloat(document.getElementById('panelCenterHeight')?.value) || 0;
        const hB = parseFloat(document.getElementById('columnHeight')?.value) || 0;
        const hs = parseFloat(document.getElementById('stiffenerCenterHeight')?.value) || 0;
        const etc = parseFloat(document.getElementById('modulusEtc')?.value) || 0;
        const tau = parseFloat(document.getElementById('tau')?.value) || 0;
        const s = parseFloat(document.getElementById('stiffenerSpacing')?.value) || 0;
        const lu = parseFloat(document.getElementById('unsupportedLength')?.value) || 0;
        const cu = parseFloat(document.getElementById('curvature')?.value) || 0;
        const sigmaCt = parseFloat(document.getElementById('sigmaCt')?.value) || 0;
        const sigmaUf = parseFloat(document.getElementById('ultimateFlexuralStrength')?.value) || 0;
        const sigmaU = parseFloat(document.getElementById('ultimateTensileStrength')?.value) || 0;
        const sigmaY = parseFloat(document.getElementById('yieldTensileStrength')?.value) || 0;
        const sigmaUt = parseFloat(document.getElementById('ultimateTensileStrengthOuterFiber')?.value) || 0;
        const sigmaUc = parseFloat(document.getElementById('ultimateCompressionStrengthInnerFiber')?.value) || 0;
        const eio = parseFloat(document.getElementById('averageYoungModulus')?.value) || 0;
        const tauU = parseFloat(document.getElementById('ultimateShearStrengthCore')?.value) || 0;

        const tFinalDisplay = document.getElementById('tFinalDisplay');
        const wMinDisplay = document.getElementById('wMinDisplay'); 

        const craft = { designCategory, analysisType, samplingZone, material, BC, B04, mLDC, LH, V, BWL, LWL, b, l, x, c, z, hp, hB, hs, etc, tau, s, lu, cu, sigmaCt, sigmaUf, sigmaU, sigmaY, sigmaUt, sigmaUc, eio, tauU, fiberType, exteriorFiberType, interiorFiberType, sandwichCoreType };
        let minThickness, woodT, metalT, w_min, ar, k2, pressure, tFinalValue, resultados;
        let resultadosPlating = {};
        let resultadosStifeners = {};

        if (analysisType === 'Plating') {
            let tFinal = 0;
            ar = l / b; 
            k2 = Math.min(Math.max((0.271 * (ar ** 2) + 0.910 * ar - 0.554) / ((ar ** 2) - 0.313 * ar + 1.351), 0.308), 0.5);
            
            switch (samplingZone) {
                case 'Fondo':
                    resultados = bottomPressure(craft);
                    pressure = resultados.Pressure;
            
                    if (material === 'Fibra laminada') {
                        resultadosPlating = FRPSingleSkinPlating(b, sigmaUf, c, k2, pressure);
                        tFinal = resultadosPlating.thickness;
                        w_min = minBottomThickness(craft, sigmaY, sigmaUf);
                        wMinDisplay.value = w_min.toFixed(4);

                    } else if (material === 'Acero' || material === 'Aluminio') {
                        resultadosPlating = metalPlating(b, sigmaU, sigmaY, c, k2, pressure);   
                        metalT = resultadosPlating.thickness;
                        minThickness = minBottomThickness(craft, sigmaY);
                        resultadosPlating.wMin = minThickness;
                        tFinal = Math.max(metalT, minThickness);

                    } else if (material === 'Madera (laminada y plywood)') {
                        resultadosPlating = woodPlating(b, sigmaUf, k2, pressure); 
                        woodT = resultadosPlating.thickness;
                        minThickness = minBottomThickness(craft, null, sigmaUf);
                        resultadosPlating.wMin = minThickness;
                        tFinal = Math.max(woodT, minThickness);

                    } else if (material === 'Fibra con nucleo (Sandwich)') {
                        b = Math.min(b, 330 * craft.LH);
                        k3 = Math.min(Math.max((0.027 * (ar ** 2) - 0.029 * ar + 0.011) / ((ar ** 2) - 1.463 * ar + 1.108), 0.014), 0.028);

                        const results = FRP_sandwich_plating(b, ar, c, sigmaUt, sigmaUc, eio, tauU, k2, k3, pressure, craft);
                        tFinal = results;
                        const minThicknessResults = minBottomThickness(craft);
                        resultadosPlating = results;
                        resultadosPlating.wos = minThicknessResults.wos;
                        resultadosPlating.wis = minThicknessResults.wis;
                        resultadosPlating.wMin = minThicknessResults.wMin;
                    

                        document.getElementById('SMInnerDisplay').value = results.SM_inner.toExponential(4);
                        document.getElementById('SMOuterDisplay').value = results.SM_outter.toExponential(4);
                        document.getElementById('SecondIDisplay').value = results.second_I.toExponential(4);                        

                        const wosDisplay = document.getElementById('WosDisplay');
                        const wisDisplay = document.getElementById('WisDisplay');
                        const wMinDisplay = document.getElementById('wMinDisplay'); 

                        const truncateToDecimalPlace = (num, places) => {
                            const factor = Math.pow(10, places);
                            return Math.floor(num * factor) / factor;
                        };
                        
                        if (wosDisplay && wisDisplay && wMinDisplay) {
                            wosDisplay.value = truncateToDecimalPlace(minThicknessResults.wos, 4).toFixed(4);
                            wisDisplay.value = truncateToDecimalPlace(minThicknessResults.wis, 4).toFixed(4);
                            wMinDisplay.value = truncateToDecimalPlace(minThicknessResults.wMin, 4).toFixed(4);
                        }
                    }

                    tFinalValue = tFinal && typeof tFinal === 'object' && tFinal.thickness !== undefined ? tFinal.thickness : tFinal;
                    tFinalDisplay.value = tFinalValue ? Number(tFinalValue).toFixed(4) : '0';
                    
                    break;

                case 'Costados y Espejo':
                    resultados = sideTransomPressure(craft);
                    pressure = resultados.Pressure
        
                    if (material === 'Fibra laminada') {
                        resultadosPlating = FRPSingleSkinPlating(b, sigmaUf, c, k2, pressure);
                        tFinal = resultadosPlating.thickness;
                        w_min = minSideTransomThickness(craft, null ,sigmaUf);
                        resultadosPlating.wMin = w_min;
                        wMinDisplay.value = w_min.toFixed(4);

                    } else if (material === 'Acero' || material === 'Aluminio') {
                        resultadosPlating = metalPlating(b, sigmaU, sigmaY, c, k2, pressure);
                        metalT = resultadosPlating.thickness;
                        minThickness = minSideTransomThickness(craft, sigmaY);
                        resultadosPlating.wMin = minThickness;
                        tFinal = Math.max(metalT, minThickness);

                    } else if (material === 'Madera (laminada y plywood)') {
                        resultadosPlating = woodPlating(b, sigmaUf, k2, pressure); 
                        woodT = resultadosPlating.thickness;
                        minThickness = minSideTransomThickness(sigmaUf);
                        resultadosPlating.wMin = minThickness;
                        tFinal = Math.max(woodT, minThickness);

                    } else if (material === 'Fibra con nucleo (Sandwich)') {
                        b = Math.min(b, 330 * craft.LH);
                        k3 = Math.min(Math.max((0.027 * (ar ** 2) - 0.029 * ar + 0.011) / ((ar ** 2) - 1.463 * ar + 1.108), 0.014), 0.028);

                        const results = FRP_sandwich_plating(b, ar, c, sigmaUt, sigmaUc, eio, tauU, k2, k3, pressure, craft);
                        tFinal = results;
                        const minThicknessResults = minBottomThickness(craft, b, c);
                        resultadosPlating = results;
                        resultadosPlating.wos = minThicknessResults.wos;
                        resultadosPlating.wis = minThicknessResults.wis;
                        resultadosPlating.wMin = minThicknessResults.wMin;

                        document.getElementById('SMInnerDisplay').value = results.SM_inner.toExponential(4);
                        document.getElementById('SMOuterDisplay').value = results.SM_outter.toExponential(4);
                        document.getElementById('SecondIDisplay').value = results.second_I.toExponential(4);                        

                        const wosDisplay = document.getElementById('WosDisplay');
                        const wisDisplay = document.getElementById('WisDisplay');
                        const wMinDisplay = document.getElementById('wMinDisplay'); 

                        const truncateToDecimalPlace = (num, places) => {
                            const factor = Math.pow(10, places);
                            return Math.floor(num * factor) / factor;
                        };
                        
                        if (wosDisplay && wisDisplay && wMinDisplay) {
                            wosDisplay.value = truncateToDecimalPlace(minThicknessResults.wos, 4).toFixed(4);
                            wisDisplay.value = truncateToDecimalPlace(minThicknessResults.wis, 4).toFixed(4);
                            wMinDisplay.value = truncateToDecimalPlace(minThicknessResults.wMin, 4).toFixed(4);
                        }
                    }
                    

                    tFinalValue = tFinal && typeof tFinal === 'object' && tFinal.thickness !== undefined ? tFinal.thickness : tFinal;
                    tFinalDisplay.value = tFinalValue ? Number(tFinalValue).toFixed(4) : '0';

                    break;

                case 'Cubierta':
                    resultados = deckPressure(craft);
                    pressure = resultados.Pressure

                    if (material === 'Fibra laminada') {
                        resultadosPlating = FRPSingleSkinPlating(b, sigmaUf, c, k2, pressure);
                        tFinal = resultadosPlating.thickness;
                        w_min = minDeckThickness(craft);
                        resultadosPlating.wMin = w_min;
                        wMinDisplay.value = w_min.toFixed(4);

                    } else if (material === 'Acero' || material === 'Aluminio') {
                        resultadosPlating = metalPlating(b, sigmaU, sigmaY, c, k2, pressure);
                        metalT = resultadosPlating.thickness;
                        minThickness = minDeckThickness(craft);
                        resultadosPlating.wMin = minThickness;
                        tFinal = Math.max(metalT, minThickness);

                    } else if (material === 'Madera (laminada y plywood)') {
                        resultadosPlating = woodPlating(b, sigmaUf, k2, pressure); 
                        woodT = resultadosPlating.thickness;
                        minThickness = minDeckThickness(craft);
                        resultadosPlating.wMin = minThickness;
                        tFinal = Math.max(woodT, minThickness);

                    }  else if (material === 'Fibra con nucleo (Sandwich)') {
                        b = Math.min(b, 330 * craft.LH);
                        k3 = Math.min(Math.max((0.027 * (ar ** 2) - 0.029 * ar + 0.011) / ((ar ** 2) - 1.463 * ar + 1.108), 0.014), 0.028);

                        const results = FRP_sandwich_plating(b, ar, c, sigmaUt, sigmaUc, eio, tauU, k2, k3, pressure, craft);
                        tFinal = results.thickness;
                        const minThicknessResults = minBottomThickness(craft, b, c);
                        resultadosPlating = results; 
                        resultadosPlating.wos = minThicknessResults.wos;
                        resultadosPlating.wis = minThicknessResults.wis;
                        resultadosPlating.wMin = minThicknessResults.wMin;

                        document.getElementById('SMInnerDisplay').value = results.SM_inner.toExponential(4);
                        document.getElementById('SMOuterDisplay').value = results.SM_outter.toExponential(4);
                        document.getElementById('SecondIDisplay').value = results.second_I.toExponential(4);                        

                        const wosDisplay = document.getElementById('WosDisplay');
                        const wisDisplay = document.getElementById('WisDisplay');
                        const wMinDisplay = document.getElementById('wMinDisplay'); 

                        const truncateToDecimalPlace = (num, places) => {
                            const factor = Math.pow(10, places);
                            return Math.floor(num * factor) / factor;
                        };
                        
                        if (wosDisplay && wisDisplay && wMinDisplay) {
                            wosDisplay.value = truncateToDecimalPlace(minThicknessResults.wos, 4).toFixed(4);
                            wisDisplay.value = truncateToDecimalPlace(minThicknessResults.wis, 4).toFixed(4);
                            wMinDisplay.value = truncateToDecimalPlace(minThicknessResults.wMin, 4).toFixed(4);
                        }
                    }

                    tFinalValue = tFinal && typeof tFinal === 'object' && tFinal.thickness !== undefined ? tFinal.thickness : tFinal;
                    tFinalDisplay.value = tFinalValue ? Number(tFinalValue).toFixed(4) : '0';

                    break;
                 
                case 'Superestructura':
                    resultados = superstructuresDeckhousesPressure(craft);
                    pressure_dict = resultados.PSUP_M_values;
                    let results = {};

                    if (material === 'Fibra laminada') {
                        for (let location in pressure_dict) {
                            let pressure = pressure_dict[location];
                            resultadosPlating[location] = FRPSingleSkinPlating(b, sigmaUf, c, k2, pressure);
                            tFinal = resultadosPlating[location].thickness;
                            results[location] = tFinal;
                        } updateSuperstructureResults(results);
                        
                    } else if (material === 'Acero' || material === 'Aluminio') {
                        
                        for (let location in pressure_dict) {
                            let pressure = pressure_dict[location];
                            resultadosPlating[location] = metalPlating(b, sigmaU, sigmaY, c, k2, pressure);
                            tFinal = resultadosPlating[location].thickness; 
                            results[location] = tFinal;
                        } updateSuperstructureResults(results);

                    } else if (craft.material === 'Madera (laminada y plywood)') {

                        for (let location in pressure_dict) {
                            let pressure = pressure_dict[location];
                            resultadosPlating[location] = woodPlating(b, sigmaUf, k2, pressure); 
                            tFinal = resultadosPlating[location].thickness;
                            results[location] = tFinal;
                        } updateSuperstructureResults(results);

                    } else {
                        b = Math.min(b, 330 * craft.LH);
                        const k3 = Math.min(Math.max((0.027 * (ar ** 2) - 0.029 * ar + 0.011) / ((ar ** 2) - 1.463 * ar + 1.108), 0.014), 0.028);

                        const results = {};
                        for (const [location, pressure] of Object.entries(pressure_dict)) {
                            resultadosPlating[location] = FRP_sandwich_plating(b, ar, c, sigmaUt, sigmaUc, eio, tauU, k2, k3, pressure, craft);
                            results[location] = {
                                Thickness: resultadosPlating[location].thickness,
                                SM_Inner: resultadosPlating[location].SM_inner,
                                SM_Outter: resultadosPlating[location].SM_outter,
                                Second_Moment_of_Area: resultadosPlating[location].second_I
                            }; 
                        } updateSuperstructureResultsSandwich(results);
                    }

                    
                    //tFinalValue = tFinal && typeof tFinal === 'object' && tFinal.thickness !== undefined ? tFinal.thickness : tFinal;
                    //tFinalDisplay.value = tFinalValue ? Number(tFinalValue).toFixed(4) : '0';

                    break;

                case 'Mamparos estancos':
                    pressure = watertightBulkheadsPressure(hB);
                    resultados = {Pressure: pressure, hB};

                    if (material === 'Fibra laminada') {

                        resultadosPlating = FRPSingleSkinPlating(b, sigmaUf, c, k2, pressure);
                        tFinal = resultadosPlating.thickness;
                        
                    } else if (material === 'Acero' || material === 'Aluminio') {
                        resultadosPlating = metalPlating(b, sigmaU, sigmaY, c, k2, pressure)
                        tFinal = resultadosPlating.thickness;
                       
                        
                    } else if (craft.material === 'Madera (laminada y plywood)') {
                        resultadosPlating = woodPlating(b, sigmaUf, k2, pressure); 
                        tFinal = resultadosPlating.thickness;
                         
                    } else {
                        b = Math.min(b, 330 * craft.LH);
                        k3 = Math.min(Math.max((0.027 * (ar ** 2) - 0.029 * ar + 0.011) / ((ar ** 2) - 1.463 * ar + 1.108), 0.014), 0.028);

                        const results = FRP_sandwich_plating(b, ar, c, sigmaUt, sigmaUc, eio, tauU, k2, k3, pressure, craft);
                        tFinal = results;
                        resultadosPlating = results;


                        document.getElementById('SMInnerDisplay').value = results.SM_inner.toExponential(4);
                        document.getElementById('SMOuterDisplay').value = results.SM_outter.toExponential(4);
                        document.getElementById('SecondIDisplay').value = results.second_I.toExponential(4);                        
                        
                    }
 
                    tFinalValue = tFinal && typeof tFinal === 'object' && tFinal.thickness !== undefined ? tFinal.thickness : tFinal;
                    tFinalDisplay.value = tFinalValue ? Number(tFinalValue).toFixed(4) : '0';

                    break;

                case 'Mamparos de tanques integrales':
                    pressure = integralTankBulkheadsPressure(hB);
                    resultados = {Pressure: pressure, hB}

                    if (material === 'Fibra laminada') {
                        resultadosPlating = FRPSingleSkinPlating(b, sigmaUf, c, k2, pressure);
                        tFinal = resultadosPlating.thickness;
                        
                    } else if (material === 'Acero' || material === 'Aluminio') {
                
                        resultadosPlating = metalPlating(b, sigmaU, sigmaY, c, k2, pressure)
                        tFinal = resultadosPlating.thickness;
                        
                    } else if (craft.material === 'Madera (laminada y plywood)') {
                        resultadosPlating = woodPlating(b, sigmaUf, k2, pressure); 
                        woodT = resultadosPlating.thickness;
                         
                    } else {
                        b = Math.min(b, 330 * craft.LH);
                        k3 = Math.min(Math.max((0.027 * (ar ** 2) - 0.029 * ar + 0.011) / ((ar ** 2) - 1.463 * ar + 1.108), 0.014), 0.028);

                        const results = FRP_sandwich_plating(b, ar, c, sigmaUt, sigmaUc, eio, tauU, k2, k3, pressure, craft);
                        tFinal = results.thickness;
                        resultadosPlating = results; 

                        document.getElementById('SMInnerDisplay').value = results.SM_inner.toExponential(4);
                        document.getElementById('SMOuterDisplay').value = results.SM_outter.toExponential(4);
                        document.getElementById('SecondIDisplay').value = results.second_I.toExponential(4);                        
                        
                    }
 
                    tFinalValue = tFinal && typeof tFinal === 'object' && tFinal.thickness !== undefined ? tFinal.thickness : tFinal;
                    tFinalDisplay.value = tFinalValue ? Number(tFinalValue).toFixed(4) : '0';

                    break;

                case 'Mamparos de colisión':
                    pressure = collisionBulkheadsPressure(hB);
                    resultados = {Pressure: pressure, hB}
                    
                    if (material === 'Fibra laminada') {
                        resultadosPlating = FRPSingleSkinPlating(b, sigmaUf, c, k2, pressure);
                        tFinal = resultadosPlating.thickness;
                        
                    } else if (material === 'Acero' || material === 'Aluminio') {
                        
                        resultadosPlating = metalPlating(b, sigmaU, sigmaY, c, k2, pressure)
                        tFinal = resultadosPlating.thickness;
                        
                    } else if (craft.material === 'Madera (laminada y plywood)') {
                        resultadosPlating = woodPlating(b, sigmaUf, k2, pressure); 
                        woodT = resultadosPlating.thickness;
                        
                    } else {
                        b = Math.min(b, 330 * craft.LH);
                        k3 = Math.min(Math.max((0.027 * (ar ** 2) - 0.029 * ar + 0.011) / ((ar ** 2) - 1.463 * ar + 1.108), 0.014), 0.028);
                        const results = FRP_sandwich_plating(b, ar, c, sigmaUt, sigmaUc, eio, tauU, k2, k3, pressure, craft);
                        tFinal = results;

                        document.getElementById('SMInnerDisplay').value = results.SM_inner.toExponential(4);
                        document.getElementById('SMOuterDisplay').value = results.SM_outter.toExponential(4);
                        document.getElementById('SecondIDisplay').value = results.second_I.toExponential(4);                        
                        
                    }

                    tFinalValue = tFinal && typeof tFinal === 'object' && tFinal.thickness !== undefined ? tFinal.thickness : tFinal;
                    tFinalDisplay.value = tFinalValue ? Number(tFinalValue).toFixed(4) : '0';

                    break;
            }
        } else if (analysisType === 'Stiffeners') {
            let pressure, tau_d, sigma_d, AW, SM;
            switch (samplingZone) {
                case 'Fondo':
                    resultados = bottomPressure(craft);
                    pressure = resultados.Pressure;
                    break;
                    
                case 'Costados y Espejo':
                    resultados = sideTransomPressure(craft);
                    pressure = resultados.Pressure;
                    break;

                case 'Cubierta':
                    resultados = deckPressure(craft);
                    pressure = resultados.Pressure;
                    break;

                case 'Superestructura':
                    resultados = superstructuresDeckhousesPressure(craft);
                    pressure = resultados.PSUP_M_values;
                    break;

                case 'Mamparos estancos':
                    pressure = watertightBulkheadsPressure(craft.hB);
                    resultados = {Pressure: pressure, hB};
                    break;

                case 'Mamparos de tanques integrales':
                    pressure = integralTankBulkheadsPressure(hB);
                    resultados = {Pressure: pressure, hB}
                    break;
                    
                case 'Mamparos de colisión':
                    pressure = collisionBulkheadsPressure(hB);
                    resultados = {Pressure: pressure, hB}
                    break;
            }

            switch (material) {
                case 'Fibra laminada' :
                    tau_d = 0.5 * tau;
                    sigma_d = 0.5 * sigmaCt;
                    resultadosStifeners = web_area_AW(pressure, s, lu, tau_d, craft);
                    AW = resultadosStifeners.AW
                    SM = min_section_modulus_SM(pressure, s, lu, cu, sigma_d, craft);
                    let I = supplementary_stiffness_requirements_for_FRP(pressure, s, lu, cu, craft);
                    resultadosStifeners.sigmaD = sigma_d;
                    resultadosStifeners.tauD = tau_d;
                    resultadosStifeners.SM = SM;
                    resultadosStifeners.I = I; 

                    break;
                case 'Aluminio':
                case 'Acero':
                    tau_d = craft.material === 'Acero' ? 0.45 * sigmaY : 0.4 * sigmaY;
                    sigma_d = craft.material === 'Acero' ? 0.8 * sigmaY : 0.7 * sigmaY;
                
                    console.log("presion: ",pressure)
                    resultadosStifeners = web_area_AW(pressure, s, lu, tau_d,craft);
                    AW = resultadosStifeners.AW;
                    SM = min_section_modulus_SM(pressure, s, lu, cu, sigma_d,craft);

                    resultadosStifeners.sigmaD = sigma_d;
                    resultadosStifeners.tauD = tau_d;
                    resultadosStifeners.SM = SM;
                    
                    break;
                case'Madera (laminada y plywood)':
                    tau_d = 0.4 * tau;
                    sigma_d = 0.4 * sigmaUf;
                
                    resultadosStifeners = web_area_AW(pressure, s, lu, tau_d, craft);
                    AW = resultadosStifeners.AW;
                    SM = min_section_modulus_SM(pressure, s, lu, cu, sigma_d, craft);

                    resultadosStifeners.sigmaD = sigma_d;
                    resultadosStifeners.tauD = tau_d;
                    resultadosStifeners.SM = SM;

                    break;

            }
            
            if (samplingZone !== 'Superestructura') {
                tFinalValue = AW;
                tFinalDisplay.value = tFinalValue ? Number(tFinalValue).toFixed(4) : '0';
            } else { updateSuperstructureResults(resultadosStifeners.resultsAW) }
            
        }
        
        // Suponiendo que resultadosPlating y resultadosStifeners son inicialmente objetos/diccionarios
        let resultadosFinales = Object.keys(resultadosPlating).length > 0 ? resultadosPlating : resultadosStifeners;
        resultadosFinales.pressure = resultados;
        console.log(calculationId)
        saveTempFormData(calculationId, resultadosFinales)
    }

    function assignEventListenersToForm() {
        const bInput = document.getElementById('baseDimension');
        const lInput = document.getElementById('longSide');
        const xInput = document.getElementById('distanceFromStern');
        const cInput = document.getElementById('panelCurvature');
        const zInput = document.getElementById('deckHeight');
        const hpInput = document.getElementById('panelCenterHeight');
        const hBInput = document.getElementById('columnHeight');
        const hsinput = document.getElementById('stiffenerCenterHeight');
        const etcInput = document.getElementById('modulusEtc');
        const tauInput = document.getElementById('tau');
        const sInput = document.getElementById('stiffenerSpacing');
        const luInput = document.getElementById('unsupportedLength');
        const cuInput = document.getElementById('curvature');
        const sigmaCtInput = document.getElementById('sigmaCt');
        const sigmaUfInput = document.getElementById('ultimateFlexuralStrength');
        const sigmaUInput = document.getElementById('ultimateTensileStrength');
        const sigmaYInput = document.getElementById('yieldTensileStrength');
        const sigmaUtInput = document.getElementById('ultimateTensileStrengthOuterFiber');
        const sigmaUcInput = document.getElementById('ultimateCompressionStrengthInnerFiber');
        const eioInput = document.getElementById('averageYoungModulus');
        const tauUInput = document.getElementById('ultimateShearStrengthCore');
        
        if (bInput) bInput.addEventListener('input', calculateAndUpdateTfinal);
        if (lInput) lInput.addEventListener('input', calculateAndUpdateTfinal);
        if (xInput) xInput.addEventListener('input', calculateAndUpdateTfinal);
        if (cInput) cInput.addEventListener('input', calculateAndUpdateTfinal);
        if (zInput) zInput.addEventListener('input', calculateAndUpdateTfinal);  
        if (hpInput) hpInput.addEventListener('input', calculateAndUpdateTfinal);
        if (hBInput) hBInput.addEventListener('input', calculateAndUpdateTfinal);
        if (hsinput) hsinput.addEventListener('input', calculateAndUpdateTfinal);
        if (etcInput) etcInput.addEventListener('input', calculateAndUpdateTfinal);
        if (tauInput) tauInput.addEventListener('input', calculateAndUpdateTfinal);
        if (sInput) sInput.addEventListener('input', calculateAndUpdateTfinal);
        if (luInput) luInput.addEventListener('input', calculateAndUpdateTfinal);
        if (cuInput) cuInput.addEventListener('input', calculateAndUpdateTfinal);
        if (sigmaCtInput) sigmaCtInput.addEventListener('input', calculateAndUpdateTfinal);
        if (sigmaUfInput) sigmaUfInput.addEventListener('input', calculateAndUpdateTfinal);
        if (sigmaUInput) sigmaUInput.addEventListener('input', calculateAndUpdateTfinal);
        if (sigmaYInput) sigmaYInput.addEventListener('input', calculateAndUpdateTfinal);
        if (sigmaUtInput) sigmaUtInput.addEventListener('input', calculateAndUpdateTfinal);
        if (sigmaUcInput) sigmaUcInput.addEventListener('input', calculateAndUpdateTfinal);
        if (eioInput) eioInput.addEventListener('input', calculateAndUpdateTfinal);
        if (tauUInput) tauUInput.addEventListener('input', calculateAndUpdateTfinal);
    }

    
});



