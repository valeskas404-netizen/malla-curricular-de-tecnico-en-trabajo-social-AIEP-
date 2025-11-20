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


// --- Funciones de Interfaz de Usuario (UI) ---

/**
 * Muestra el mensaje de bloqueo/error en la esquina superior derecha.
 * @param {string} type - Tipo de mensaje (actualmente solo 'blocked').
 * @param {string} message - Contenido del mensaje.
 */
function showMessage(type, message) {
    const msgBox = document.getElementById('message-box');
    const msgContent = document.getElementById('message-content');
    
    if (type === 'blocked') {
        document.querySelector('#message-box p').textContent = 'Ramo Bloqueado';
        msgContent.innerHTML = message;
    }

    msgBox.classList.add('show');

    clearTimeout(messageTimeout);
    messageTimeout = setTimeout(() => {
        msgBox.classList.remove('show');
    }, 4000);
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
        // Usamos la clase CSS 'semester-column' para el diseño de columna con separador
        semesterColumn.className = 'semester-column'; 
        
        // Título del Semestre: Usamos 'semester-title' para el estilo del recuadro del título
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

            // Clases base para la tarjeta: p-2 (padding muy pequeño) y texto pequeño
            let cardClasses = 'course-card text-sm'; 
            
            if (isPracticaLaboral) {
                 cardClasses += ' practica-card text-center text-sm md:text-base';
            }

            card.className = cardClasses;

            // 1. Verificar si está bloqueado
            let missingReqs = [];
            let isBlocked = false;

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
            
            // 2. Aplicar estados visuales
            const codeTextSize = isPracticaLaboral ? 'text-base' : 'text-sm';
            const nameTextSize = isPracticaLaboral ? 'text-sm' : 'text-xs';


            if (isApproved) {
                card.classList.add('approved');
                card.innerHTML = `
                    <p class="font-semibold ${codeTextSize}">${course.code}</p>
                    <p class="${nameTextSize}">${course.name}</p>
                    <span class="text-xs font-bold block mt-1">APROBADO</span>
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
 * Manejador de clic para aprobar un curso o mostrar el mensaje de bloqueo.
 * @param {string} courseCode - Código del curso clicado.
 */
function handleCourseClick(courseCode) {
    if (approvedCourses[courseCode]) {
        return; // No hacer nada si ya está aprobado
    }

    const courseElement = document.getElementById(`course-${courseCode}`);
    const course = COURSE_DATA.find(c => c.code === courseCode);

    // Obtener los requisitos faltantes (si los hay)
    const missingReqsData = courseElement.getAttribute('data-missing-reqs');

    if (missingReqsData) {
        // Ramo BLOQUEADO: Mostrar mensaje de error
        const missingReqs = JSON.parse(missingReqsData);
        
        let reqNames = missingReqs.map(code => 
            `<li>${code} - ${COURSE_NAME_MAP[code]}</li>`
        ).join('');
        
        const message = `Necesitas aprobar los siguientes ramos antes de cursar <strong>${course.name}</strong>:
            <ul class="list-disc list-inside mt-1">${reqNames}</ul>
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
    
    // Re-renderizar para actualizar todos los estados (incluyendo el desbloqueo de ramos posteriores)
    renderCurriculum();
}

// Inicialización de la aplicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    renderCurriculum();
});
