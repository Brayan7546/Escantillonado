
function bottomPressure(craft, analysisType) {
    craft.analysisType = analysisType;
    const kAR = areaPressureReductionKAR(craft);

    const kL = longitudinalPressureDistributionKL(craft);
    const kDC = designCategoryKDC(craft);
    const PBMD_BASE = 2.4 * (craft.mLDC ** 0.33) + 20;
    const PBMP_BASE = ((0.1 * craft.mLDC) / (craft.LWL * craft.BC)) * ((1 + Math.sqrt(kDC)) * dynamicLoadNCG(craft));

    const PBM_MIN = 0.45 * (craft.mLDC ** 0.33) + (0.9 * craft.LWL * kDC);

    let PBMD = PBMD_BASE * kAR * kDC * kL;

    PBMD = Math.max(PBM_MIN, PBMD);
    let PBMP = PBMP_BASE * kAR * kDC * kL;
    PBMP = Math.max(PBM_MIN, PBMP);

    Pressure = Math.max(PBMD, PBMP);
    return {Pressure, kAR, kL, kDC };
}

function longitudinalPressureDistributionKL(craft) {
    let x = craft.x === 0 ? craft.LWL : craft.x;
    const xLWL = x / craft.LWL;
    let kL;
    if (xLWL > 0.6) {
        kL = 1;
    } else {
        const nCGClamped = Math.min(Math.max(dynamicLoadNCG(craft), 3), 6);
        kL = ((1 - 0.167 * nCGClamped) * xLWL / 0.6) + (0.167 * nCGClamped);
    }
    return kL;
}

function dynamicLoadNCG(craft) {
    // Calcula nCG usando la ecuación (1)
    const nCG1 = 0.32 * ((craft.LWL / (10 * craft.BC)) + 0.084) * (50 - craft.B04) * ((Math.pow(craft.V, 2) * Math.pow(craft.BC, 2)) / craft.mLDC);
    // Calcula nCG usando la ecuación (2)
    const nCG2 = (0.5 * craft.V) / Math.pow(craft.mLDC, 0.17);
    // Decide cuál valor de nCG usar
    let nCG;
    if (nCG1 > 3) {
        nCG = Math.min(nCG1, nCG2);
    } else {
        nCG = nCG1;
    }
    // Asegura que nCG no sea mayor que 7
    nCG = Math.min(nCG, 7);
    
    // Advertencia si nCG es mayor que 7
    if (nCG > 7) {
        console.warn(`CUIDADO: El valor de carga dinámica (nCG)= ${nCG} no debe ser mayor a 7, revise sus parametros iniciales`);
    }
    
    return nCG;
}


function designCategoryKDC(craft) {
    let kDC;
    switch (craft.designCategory) {
        case 'Oceano':
            kDC = 1;
            break;
        case 'Offshore':
            kDC = 0.8;
            break;
        case 'Inshore':
            kDC = 0.6;
            break;
        default:
            kDC = 0.4;
            break;
    }
    return kDC;
}


function curvatureCorrectionKC(b, c) {
    const cb = c / b;
    let kC;
    if (cb <= 0.03) {
        kC = 1.0;
    } else if (cb > 0.03 && cb <= 0.18) {
        kC = 1.1 - (3.33 * c) / b;
    } else {
        kC = 0.5;
    }
    return Math.max(Math.min(kC, 1.0), 0.5);
}

function FRPSingleSkinPlating(b, sigmaUf, c, k2, pressure) {
    const sigmaD = 0.5 * sigmaUf;
    const kC = curvatureCorrectionKC(b, c);
    const thickness = b * kC * Math.sqrt((pressure * k2) / (1000 * sigmaD));
    return {k2, kC, thickness, sigmaD};
}

function minBottomThickness(craft, sigmaY, sigmaUf) {
    let tMin = 0;
    let wos, wis, wMin;

    if (craft.material === 'Fibra laminada' || craft.material === 'Fibra con nucleo (Sandwich)') {
        const k4 = 1.0;
        let k5;
        switch (craft.fiberType) {
            case 'Fibra de vidrio E con filamentos cortados':
                k5 = 1.0;
                break;
            case 'Fibra de vidrio tejida':
                k5 = 0.9;
                break;
            default:
                k5 = 0.7; // Default value if none is matched
        }
        const k6 = 1.0;
        
        wos = designCategoryKDC(craft) * k4 * k5 * k6 * (0.1 * craft.LWL + 0.15);
        
        wis = 0.7 * wos;
        
        wMin = 0.43 * k5 * (1.5 + 0.03 * craft.V + 0.15 * Math.pow(craft.mLDC, 0.33));
    
        if (craft.material === 'Fibra laminada') {
            return wMin;
        } else {
            return { wMin, wos, wis }; // Return as an object for "Fibra con nucleo (Sandwich)"
        }
    } else if (craft.material === "Aluminio") {
        tMin = Math.sqrt(125 / sigmaY) * (1 + 0.02 * craft.V + 0.1 * Math.pow(craft.mLDC, 0.33));
    } else if (craft.material === "Acero") {
        tMin = Math.sqrt(240 / sigmaY) * (1 + 0.015 * craft.V + 0.08 * Math.pow(craft.mLDC, 0.33));
    } else if (craft.material === "Madera (laminada y plywood)") {
        tMin = Math.sqrt(30 / sigmaUf) * (3 + 0.05 * craft.V + 0.3 * Math.pow(craft.mLDC, 0.33));
    }

    return tMin;
}

function metalPlating(b, sigmaU, sigmaY, c, k2, pressure) {
    console.log("k2", k2)
    const sigmaD = Math.min(0.6 * sigmaU, 0.9 * sigmaY);
    const kC = curvatureCorrectionKC(b, c); // Asegúrate de que esta función esté definida
    const thickness = b * kC * Math.sqrt((pressure * k2) / (1000 * sigmaD));
    return {k2, kC, thickness, sigmaD};
}

function woodPlating(b, sigmaUf, k2, pressure) {
    const sigmaD = 0.5 * sigmaUf;
    const thickness = b * Math.sqrt((pressure * k2) / (1000 * sigmaD));
    return {k2, thickness, sigmaD};
}

function FRP_sandwich_plating(b, ar, c, sigma_ut, sigma_uc, Eio, tau_u, k2, k3, pressure, craft) {
    const k1 = 0.017; 
    const sigma_dt = 0.5 * sigma_ut; 
    const sigma_dc = 0.5 * sigma_uc; 
    const KC = curvatureCorrectionKC(b, c); 
    
    let SM_inner = (Math.sqrt(b) * Math.sqrt(KC) * pressure * k2) / (6e5 * sigma_dt);

    let SM_outter = (Math.sqrt(b) * Math.sqrt(KC) * pressure * k2) / (6e5 * sigma_dc);
    
    let second_I = (Math.pow(b, 3) * Math.pow(KC, 3) * pressure * k3) / (12e6 * k1 * Eio);

    if (craft.exteriorFiberType !== craft.interiorFiberType) {
        second_I = (Math.pow(b, 3) * Math.pow(KC, 3) * pressure * k3) / (12e6 * k1); // EI
    }

    let tau_d;
    switch(craft.sandwichCoreType) {
        case 'Madera Balsa':
            tau_d = tau_u * 0.5;
            break;
        case 'Núcleo con elongación al corte en rotura < 35 % (PVC entrecruzado, etc.)':
            tau_d = tau_u * 0.55;
            break;
        case 'Núcleo con elongación al corte en rotura > 35 % (PVC lineal, SAN, etc.)':
            tau_d = tau_u * 0.65;
            break;
        default: // Núcleos tipo panal de abeja (compatibles con aplicaciones marinas)
            tau_d = tau_u * 0.5;
    }

    if (craft.LH < 10) {
        tau_d = Math.max(tau_d, 0.25);
    } else if (craft.LH <= 15) {
        tau_d = Math.max(tau_d, 0.25 + 0.03 * (craft.LH - 10));
    } else {
        tau_d = Math.max(tau_d, 0.40);
    }

    const kSHC = ar < 2 ? (0.035 + 0.394 * ar - 0.09 * Math.pow(ar, 2)) : 0.5;
    const thickness = Math.sqrt(KC) * ((kSHC * pressure * b) / (1000 * tau_d));
    

    return { k1,k2,k3,KC, kSHC, sigma_dt, sigma_dc, tau_d, SM_inner, SM_outter, second_I, thickness };
}

function sideTransomPressure(craft, analysisType, h) {
    craft.analysisType = analysisType;
    const kZ = hullSidePressureReductionKZ(craft.z, h);
    const kAR = areaPressureReductionKAR(craft);
    const kL = longitudinalPressureDistributionKL(craft);
    const kDC = designCategoryKDC(craft);

    PDM_BASE = 0.35 * craft.LWL + 14.6;
    PBMD_BASE = 2.4 * (craft.mLDC**0.33) + 20;
    PBMP_BASE = ((0.1 * craft.mLDC)/(craft.LWL * craft.BC))*((1+designCategoryKDC(craft)**0.5) * dynamicLoadNCG(craft));
    PSM_MIN = 0.9 * craft.LWL * designCategoryKDC(craft);

    let PSMD = (PDM_BASE + kZ * (PBMD_BASE - PDM_BASE)) * kAR * kDC * kL;
    let PSMP = (PDM_BASE + kZ * (0.25 * PBMP_BASE - PDM_BASE)) * kAR * kDC * kL;

    PSMD = Math.max(PSM_MIN, PSMD);
    PSMP = Math.max(PSM_MIN, PSMP);
    

    const Pressure = Math.max(PSMD, PSMP);
    return {Pressure, kZ, kAR, kL, kDC };
}


function areaPressureReductionKAR(craft) {
    let AD;

    if (craft.analysisType === 'Plating') {
        AD = Math.min((craft.l * craft.b) * 1e-6, 2.5 * (craft.b ** 2) * 1e-6);
    } else {
        AD = Math.max((craft.s * craft.lu) * 1e-6, 0.33 * (craft.lu ** 2) * 1e-6);
    } 

    let kR = craft.analysisType === 'Plating' ? 1.5 - 3e-4 * craft.b : 1 - 2e-4 * craft.lu;
    kR = Math.max(kR, 1.0);

    let kAR = (kR * 0.1 * (craft.mLDC ** 0.15)) / (AD ** 0.3);
    kAR = Math.min(kAR, 1);

    const min_kAR = craft.material === 'Fibra con nucleo (Sandwich)' ? 0.4 : 0.25;
    kAR = Math.max(min_kAR, kAR);

    return kAR;
}


function hullSidePressureReductionKZ(Z, h) {
    return (Z - h) / Z;
}

function minSideTransomThickness( craft, sigmaY, sigmaUf) {
    let tMin = 0;
    let wos, wis, wMin;

    if (craft.material === 'Fibra laminada' || craft.material === 'Fibra con nucleo (Sandwich)') {
        const k4 = 0.9;
        let k5;
        if (craft.fiberType === 'Fibra de vidrio E con filamentos cortados') {
            k5 = 1.0;
        } else if (craft.fiberType === 'Fibra de vidrio tejida') {
            k5 = 0.9;
        } else { // Fibra tejida de carbono, aramida(kevlar) o híbrida
            k5 = 0.7;
        }
        const k6 = 1.0;
        wos = designCategoryKDC(craft) * k4 * k5 * k6 * (0.1 * craft.LWL + 0.15);
        wis = 0.7 * wos;
        wMin = 0.43 * k5 * (1.5 + 0 * craft.V + 0.15 * craft.mLDC ** 0.33);
        if (craft.material === 'Fibra laminada') {
            return wMin;
        } else {
            return { wMin, wos, wis };
        }
    } else if (craft.material === "Aluminio") {
        tMin = Math.sqrt(125 / sigmaY) * (1 + 0 * craft.V + 0.1 * craft.mLDC ** 0.33);
    } else if (craft.material === "Acero") {
        tMin = Math.sqrt(240 / sigmaY) * (1 + 0 * craft.V + 0.08 * craft.mLDC ** 0.33);
    } else if (craft.material === "Madera (laminada y plywood)") {
        tMin = Math.sqrt(30 / sigmaUf) * (3 + 0 * craft.V + 0.3 * craft.mLDC ** 0.33);
    }
    return tMin;
}

function deckPressure(craft, analysisType) {
    craft.analysisType = analysisType;
    let kAR = areaPressureReductionKAR(craft);
    let kDC = designCategoryKDC(craft);
    let kL = longitudinalPressureDistributionKL(craft);

    let PDM_BASE = 0.35 * craft.LWL + 14.6;  

    let PDM = PDM_BASE * kAR * kDC * kL;

    const PDM_MIN = 5;

    Pressure = Math.max(PDM_MIN, PDM);

    return {kAR, kDC, kL, Pressure};
}

function minDeckThickness(craft) {
    let wos, wis, k4, k5, k6, t, wMin;

    if (craft.material === 'Fibra laminada' || craft.material === 'Fibra con nucleo (Sandwich)') {
        k4 = 0.7;
        switch (craft.fiberType) {
            case 'Fibra de vidrio E con filamentos cortados':
                k5 = 1.0;
                break;
            case 'Fibra de vidrio tejida':
                k5 = 0.9;
                break;
            default: 
                k5 = 0.7;
                break;
        }
        k6 = 1.0;
        let kDC = designCategoryKDC(craft); // Suponiendo que esta función está definida en otro lugar
        wos = kDC * k4 * k5 * k6 * (0.1 * craft.LWL + 0.15);
        wis = 0.7 * wos;
        wMin = k5 * (1.45 + 0.14 * craft.LWL);

        if (craft.material === 'Fibra laminada') {
            return wMin;
        } else {
            return { wMin, wos, wis };
        }
    } else if (craft.material === "Aluminio") {
        t = 1.35 + 0.06 * craft.LWL;
    } else if (craft.material === "Acero") {
        t = 1.5 + 0.07 * craft.LWL;
    } else if (craft.material === "Madera (laminada y plywood)") {
        t = 3.8 + 0.17 * craft.LWL;
    }

    return t;
}

function superstructuresDeckhousesPressure(craft, analysisType) {
    craft.analysisType = analysisType;
    const kAR = areaPressureReductionKAR(craft); 
    const kDC = designCategoryKDC(craft); 
    const kSUP_values = superstructureDeckhousePressureReductionKSUP(); 
    const PDM_BASE = 0.35 * craft.LWL + 14.6
    const PDM_MIN = 5

    let PSUP_M_values = {};
    for (const [location, kSUP] of Object.entries(kSUP_values)) {
        Pressure = Math.max(PDM_BASE * kDC * kAR * kSUP, PDM_MIN); 
        PSUP_M_values[location] = Pressure;
    }

    return {PSUP_M_values, kAR, kDC, kSUP_values};
}

function superstructureDeckhousePressureReductionKSUP() {
    const kSUP_values = {
        'A Proa': 1,
        'Lateral (Área de Paso)': 0.67,
        'Lateral (Área de No Paso)': 0.5,
        'A Popa': 0.5,
        'Superior <= 800 mm sobre cubierta': 0.5, 
        'Superior > 800 mm sobre cubierta': 0.35, 
        'Niveles Superiores': 0                   
    };

    return kSUP_values;
}

function watertightBulkheadsPressure(hB){
    PWB = 7 * hB
    Pressure = PWB
    return Pressure
}

function integralTankBulkheadsPressure(hB){
    PTB = 10 * hB
    Pressure = PTB
    return Pressure
}
    
function collisionBulkheadsPressure(hB){
    PTB = 10 * hB
    Pressure = PTB;
    return Pressure
}

function web_area_AW(pressure, s, lu, tau_d, craft) {
    const waterColumnHeightZones = ['Mamparos de colisión', 'Mamparos de tanques integrales', 'Mamparos estancos'];
    const kSA = waterColumnHeightZones.includes(craft.samplingZone) ? 7.5 : 5;
    const kSUP_values = superstructureDeckhousePressureReductionKSUP();

    if (craft.samplingZone === 'Superestructura') {
        let resultsAW = {};
        for (const [location, kSUP] of Object.entries(kSUP_values)) {
            resultsAW[location] = (kSA * pressure[location] * s * lu / tau_d) * 1e-6;
        }
        return {resultsAW, kSA};;
    } else {
        let AW = (kSA * pressure * s * lu / tau_d) * 1e-6
        return {AW, kSA};
    }
}


function min_section_modulus_SM(pressure, s, lu, cu, sigma_d, craft) {
    const kSUP_values = superstructureDeckhousePressureReductionKSUP();
    let kCS = curvatureFactorForStiffenersKCS(cu, lu);
    const PDM_BASE = 0.35 * craft.LWL + 14.6
    let resultados_SM = {};

    if (craft.samplingZone === 'Superestructura') {
        for (const [location, kSUP] of Object.entries(kSUP_values)) {
                let pres =  Math.max(PDM_BASE * kSUP, 5);
                let SM = (83.33 * kCS * pres * s * Math.pow(lu, 2)) / sigma_d * 1e-9;
                resultados_SM[location] = SM;
        }
        return resultados_SM;
    } else {
        let SM = (83.33 * kCS * pressure * s * Math.pow(lu, 2)) / sigma_d * 1e-9;
        return SM;
    }
}

function curvatureFactorForStiffenersKCS(cu, lu) {
    let culu = cu / lu;
    let kCS;

    if (culu <= 0.03) {
        kCS = 1.0;
    } else if (culu > 0.03 && culu <= 0.18) {
        kCS = 1.1 - 3.33 * (cu / lu);
    } else { 
        kCS = 0.5;
    }

    // Aplica las restricciones de que kCS no debe ser menor a 0.5 ni mayor a 1.0
    kCS = Math.max(Math.min(kCS, 1.0), 0.5);
    return kCS;
}

function supplementary_stiffness_requirements_for_FRP(pressure, s, lu, cu, craft) {
    let resultados_I = {};
    const kSUP_values = superstructureDeckhousePressureReductionKSUP();
    const kCS = curvatureFactorForStiffenersKCS(cu, lu);
    const PDM_BASE = 0.35 * craft.LWL + 14.6

    if (craft.samplingZone === 'Superestructura') {
        for (const [location, kSUP] of Object.entries(kSUP_values)) {
            let pres =  Math.max(PDM_BASE * kSUP, 5);
            const I = (26 * Math.pow(kCS, 1.5) * pres * s * Math.pow(lu, 3)) / (0.05 * craft.etc) * 1e-11;
            resultados_I[location] = I;
        }
        return resultados_I;
    } else {
        const I = (26 * Math.pow(kCS, 1.5) * pressure * s * Math.pow(lu, 3)) / (0.05 * craft.etc) * 1e-11;
        return I;
    }
}
