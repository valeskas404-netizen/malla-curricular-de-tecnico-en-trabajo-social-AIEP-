// Configuración de la Malla Curricular
const COURSE_DATA = [
    { code: 'TTS101', name: 'Bases de Trabajo Social', semester: 1, reqs: [] },
    { code: 'CTA101', name: 'Comunicación y Técnicas de Aprendizaje', semester: 1, reqs: [] },
    { code: 'TTS103', name: 'Derechos Humanos', semester: 1, reqs: [] },
    { code: 'TTS102', name: 'Dimensión Psicosocial de la Persona', semester: 1, reqs: [] },
    { code: 'HPE101', name: 'Herramientas para la Empleabilidad', semester: 1, reqs: [] },
    { code: 'MES101', name: 'Matemática para Educación Superior', semester: 1, reqs: [] },
    
    { code: 'SDC001', name: 'Certificado de Especialidad I', semester: 2, reqs: ['HPE101'] },
    { code: 'TTS202', name: 'Derecho de Familia y NNA', semester: 2, reqs: ['TTS102'] },
    { code: 'HPI201', name: 'Herramientas para la Innovación', semester: 2, reqs: [] },
    { code: 'TTS203', name: 'Inclusión Social y Diversidad', semester: 2, reqs: ['TTS103'] },
    { code: 'TTS201', name: 'Modelos y Estrategias del Trabajo Social', semester: 2, reqs: ['TTS101'] },
    { code: 'TTS204', name: 'Técnicas Administrativas para el Trabajo Social', semester: 2, reqs: ['MES101'] },

    { code: 'TTS301', name: 'Ámbitos e Institucionalidad del Trabajo Social', semester: 3, reqs: ['TTS201'] },
    { code: 'SDC002', name: 'Certificado de Especialidad II', semester: 3, reqs: ['TTS204'] },
    { code: 'ING301', name: 'Inglés Inicial I', semester: 3, reqs: ['SDC001'] },
    { code: 'TTS302', name: 'Proyectos Sociales', semester: 3, reqs: ['TTS202'] },
    { code: 'SOR301', name: 'Sustentabilidad en la Organización', semester: 3, reqs: [] },
    { code: 'TTS303', name: 'Trabajo Social y Desarrollo de la Infancia', semester: 3, reqs: ['TTS203'] },

    { code: 'SDC003', name: 'Certificado de Especialidad III', semester: 4, reqs: ['SDC002'] },
    { code: 'ING401', name: 'Inglés Inicial II', semester: 4, reqs: ['ING301'] },
    { code: 'TTS401', name: 'Políticas Sociales y Comunidad', semester: 4, reqs: ['TTS302'] },
    { code: 'MAP401', name: 'Taller de Marca Personal', semester: 4, reqs: [] },
    { code: 'TPE401', name: 'Taller de Proyecto de Especialidad', semester: 4, reqs: ['TTS301'] },
    { code: 'TTS402', name: 'Trabajo Seguridad Social', semester: 4, reqs: ['TTS303'] },

    // Caso especial: Práctica Laboral. 'ALL' indica que requiere todos los demás ramos.
    { code: 'LAB001', name: 'Practica laboral', semester: 5, reqs: ['ALL'] } 
];

// Mapeo para nombres completos de los cursos (facilita la búsqueda de requisitos)
const COURSE_NAME_MAP = COURSE_DATA.reduce((acc, course) => {
    acc[course.code] = course.name;
    return acc;
}, {});

// Estado de los ramos aprobados (inicializado vacío, se cargará desde localStorage)
let approvedCourses = {};
let messageTimeout; // Para controlar la desaparición del mensaje de bloqueo

// --- Funciones de Persistencia (localStorage) ---

/**
 * Carga el estado de los ramos aprobados desde el almacenamiento local del navegador.
 */
function loadState() {
    try {
        const savedState = localStorage.getItem('curriculumApprovedCourses'); 
        if (savedState) {
            approvedCourses = JSON.parse(savedState);
        }
    } catch (error) {
        console.error("Error al cargar el estado de localStorage:", error);
    }
}

/**
 * Guarda el estado actual de los ramos aprobados en el almacenamiento local.
 */
function saveState() {
    try {
        localStorage.setItem('curriculumApprovedCourses', JSON.stringify(approvedCourses));
    } catch (error) {
        console.error("Error al guardar el estado en localStorage:", error);
    }
}

/**
 * Borra todos los datos guardados en localStorage y reinicia la aplicación.
 * Útil para debugging o si la cadena de dependencias se vuelve inmanejable.
 */
function clearAllData() {
    localStorage.removeItem('curriculumApprovedCourses');
    approvedCourses = {};
    renderCurriculum();
    
    // Mostrar un mensaje de éxito con colores verdes
    const msgBox = document.getElementById('message-box');
    const msgContent = document.getElementById('message-content');
    
    // Cambiar a mensaje de éxito
    document.querySelector('#message-box p').textContent = 'Malla Reiniciada';
    msgContent.innerHTML = '<span class="text-green-700 font-bold">¡Progreso borrado!</span> Puedes empezar de nuevo.';
    
    // Ajustar clases para visualización de éxito
    msgBox.classList.remove('text-red-700', 'border-l-4', 'border-red-500');
    msgBox.classList.add('bg-green-100', 'border-green-500', 'border-l-4'); 
    msgBox.classList.add('show');

    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        msgBox.classList.remove('show', 'bg-green-100', 'border-green-500');
        // Restaurar clases de error (por si acaso el próximo mensaje es un error)
        document.querySelector('#message-box p').textContent = 'Acción Bloqueada';
        msgBox.classList.remove('bg-green-100', 'border-green-500');
    }, 4000);
}


// --- Funciones de Lógica de la Malla ---

/**
 * Organiza la lista de cursos por semestre.
 * @returns {Object} Un objeto donde las claves son los números de semestre.
 */
function getCoursesBySemester() {
    return COURSE_DATA.reduce((acc, course) => {
        if (!acc[course.semester]) {
            acc[course.semester] = [];
        }
        acc[course.semester].push(course);
        return acc;
    }, {});
}

/**
 * Obtiene la lista de códigos de todos los cursos, excluyendo la Práctica Laboral.
 * @returns {string[]} Lista de códigos de curso.
 */
function getAllCourseCodesExceptPractica() {
    return COURSE_DATA
        .filter(c => c.code !== 'LAB001')
        .map(c => c.code);
}

/**
 * Verifica si algún curso aprobado requiere el curso dado como requisito.
 * @param {string} prerequisiteCode - Código del curso que se quiere desaprobar.
 * @returns {string[]} Lista de códigos de cursos aprobados que dependen del curso dado.
 */
function checkDownstreamDependents(prerequisiteCode) {
    const dependents = [];
    const allOtherCourses = getAllCourseCodesExceptPractica();

    // Recorrer todos los cursos (posibles dependientes)
    COURSE_DATA.forEach(course => {
        const courseCode = course.code;

        // 1. Si el curso dependiente está aprobado
        if (approvedCourses[courseCode]) {
            
            // 2. Revisar si el curso dependiente requiere el curso dado
            if (courseCode === 'LAB001' && course.reqs.includes('ALL')) {
                // Si es la Práctica Laboral y está aprobada, requiere todos los demás.
                // Si el ramo a desaprobar es cualquier ramo de la lista, es un dependiente.
                if (allOtherCourses.includes(prerequisiteCode)) {
                    dependents.push(courseCode);
                }
            } else if (course.reqs.includes(prerequisiteCode)) {
                dependents.push(courseCode);
            }
        }
    });
    // Usar Set para eliminar duplicados y devolver la lista
    return [...new Set(dependents)];
}


// --- Funciones de Interfaz de Usuario (UI) ---

/**
 * Muestra el mensaje de bloqueo/error en la esquina superior derecha.
 * @param {string} type - Tipo de mensaje (actualmente solo 'blocked').
 * @param {string} message - Contenido del mensaje.
 */
function showMessage(type, message) {
    const msgBox = document.getElementById('message-box');
    const msgContent = document.getElementById('message-content');
    
    // Aseguramos que el encabezado del mensaje sea consistente
    document.querySelector('#message-box p').textContent = 'Acción Bloqueada';
    msgContent.innerHTML = message;
    

    msgBox.classList.add('show');

    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        msgBox.classList.remove('show');
    }, 6000); // Mantenemos el tiempo para leer mensajes de bloqueo
}

// --- Renderizado Principal ---

/**
 * Renderiza o actualiza completamente la malla curricular en el DOM.
 */
function renderCurriculum() {
    const coursesBySemester = getCoursesBySemester();
    const grid = document.getElementById('curriculum-grid');
    grid.innerHTML = ''; // Limpiar la grilla

    const allCourseCodes = getAllCourseCodesExceptPractica();

    // Iterar sobre los semestres
    Object.keys(coursesBySemester).sort().forEach(semester => {
        const semesterCourses = coursesBySemester[semester];
        
        const semesterColumn = document.createElement('div');
        semesterColumn.className = 'semester-column'; 
        
        const title = document.createElement('h2');
        title.className = 'semester-title';
        title.textContent = `Semestre ${semester}`;
        semesterColumn.appendChild(title);

        // Renderizar los ramos del semestre
        semesterCourses.forEach(course => {
            const isApproved = approvedCourses[course.code];
            const isPracticaLaboral = course.code === 'LAB001';
            
            const card = document.createElement('div');
            card.id = `course-${course.code}`;
            card.setAttribute('data-course-code', course.code);

            let cardClasses = 'course-card text-sm'; 
            
            if (isPracticaLaboral) {
                 cardClasses += ' practica-card text-center text-sm md:text-base';
            }

            card.className = cardClasses;

            // 1. Verificar si está bloqueado por requisitos faltantes
            let missingReqs = [];
            let isBlocked = false;

            if (!isApproved) {
                if (isPracticaLaboral) {
                    missingReqs = allCourseCodes.filter(code => !approvedCourses[code]);
                    if (missingReqs.length > 0) {
                        isBlocked = true;
                    }
                } else if (course.reqs.length > 0) {
                    missingReqs = course.reqs.filter(reqCode => !approvedCourses[reqCode]);
                    if (missingReqs.length > 0) {
                        isBlocked = true;
                    }
                }
            }
            
            // 2. Aplicar estados visuales
            const codeTextSize = isPracticaLaboral ? 'text-base' : 'text-sm';
            const nameTextSize = isPracticaLaboral ? 'text-sm' : 'text-xs';


            if (isApproved) {
                card.classList.add('approved');
                card.innerHTML = `
                    <p class="font-semibold ${codeTextSize}">${course.code}</p>
                    <p class="${nameTextSize}">${course.name}</p>
                    <span class="text-xs font-bold block mt-1">APROBADO (CLIC PARA DESAPROBAR)</span>
                `;
            } else if (isBlocked) {
                card.classList.add('blocked');
                card.setAttribute('data-missing-reqs', JSON.stringify(missingReqs));
                 card.innerHTML = `
                    <p class="font-semibold ${codeTextSize}">${course.code}</p>
                    <p class="${nameTextSize}">${course.name}</p>
                    <span class="text-xs font-bold block mt-1">BLOQUEADO</span>
                `;
            } else {
                 card.innerHTML = `
                    <p class="font-semibold ${codeTextSize}">${course.code}</p>
                    <p class="${nameTextSize} text-gray-500">${course.name}</p>
                `;
            }


            // Asignar el listener de clic
            card.addEventListener('click', () => handleCourseClick(course.code));

            semesterColumn.appendChild(card);
        });

        grid.appendChild(semesterColumn);
    });
}

/**
 * Manejador de clic para aprobar, desaprobar un curso o mostrar el mensaje de bloqueo.
 * @param {string} courseCode - Código del curso clicado.
 */
function handleCourseClick(courseCode) {
    const course = COURSE_DATA.find(c => c.code === courseCode);

    // --- LÓGICA DE DESAPROBACIÓN (UNDO) ---
    if (approvedCourses[courseCode]) {
        // 1. Verificar si hay ramos aprobados que dependen de este.
        const dependentCourses = checkDownstreamDependents(courseCode);

        if (dependentCourses.length > 0) {
            // BLOQUEO: No se puede desaprobar porque rompe la cadena de requisitos
            
            // Generamos la lista de dependientes para el mensaje
            let reqNames = dependentCourses.map(code => 
                `<li><strong>${code}</strong> - ${COURSE_NAME_MAP[code]}</li>`
            ).join('');
            
            // Mensaje clarificado
            const message = `No puedes desaprobar <strong>${course.name}</strong> porque es un requisito obligatorio para los siguientes ramos que ya marcaste como APROBADOS:
                <ul class="list-disc list-inside mt-2 ml-4">${reqNames}</ul>
                <p class="mt-3 font-bold">Para desaprobar este ramo, debes primero desaprobar (haciendo clic) todos sus dependientes listados arriba.</p>
            `;
            
            showMessage('blocked', message);
            return;
        }

        // 2. DESAPROBAR: Si no hay dependientes aprobados, desaprobar el ramo.
        delete approvedCourses[courseCode];
        saveState();
        
        // Re-renderizar para actualizar todos los estados
        renderCurriculum();
        return; 
    }
    
    // --- LÓGICA DE APROBACIÓN (NORMAL) ---
    
    const courseElement = document.getElementById(`course-${courseCode}`);

    // Obtener los requisitos faltantes (si los hay)
    const missingReqsData = courseElement.getAttribute('data-missing-reqs');

    if (missingReqsData) {
        // Ramo BLOQUEADO por prerrequisitos
        const missingReqs = JSON.parse(missingReqsData);
        
        let reqNames = missingReqs.map(code => 
            `<li><strong>${code}</strong> - ${COURSE_NAME_MAP[code]}</li>`
        ).join('');
        
        const message = `Necesitas aprobar los siguientes ramos antes de cursar <strong>${course.name}</strong>:
            <ul class="list-disc list-inside mt-2 ml-4">${reqNames}</ul>
        `;
        
        showMessage('blocked', message);
        
        // Reiniciar la animación de bloqueo para dar feedback visual
        courseElement.classList.remove('blocked');
        void courseElement.offsetWidth; // Truco para forzar reflow
        courseElement.classList.add('blocked');
        return;
    }

    // Aprobar el ramo
    approvedCourses[courseCode] = true;
    saveState();
    
    // Re-renderizar para actualizar todos los estados 
    renderCurriculum();
}

// Inicialización de la aplicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderCurriculum();

    // Adjuntar listener al nuevo botón de Reinicio
    const resetButton = document.getElementById('reset-button');
    if (resetButton) {
        resetButton.addEventListener('click', clearAllData);
    }
});
