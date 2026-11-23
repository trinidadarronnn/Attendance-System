// public/js/students.js

const studentsBody = document.getElementById('studentsBody');
const searchInput = document.getElementById('searchInput');
const pageMessage = document.getElementById('pageMessage');

const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const fId = document.getElementById('fId');
const fName = document.getElementById('fName');
const fDept = document.getElementById('fDept');
const fLevel = document.getElementById('fLevel');
const saveBtn = document.getElementById('saveBtn');

let students = [];     // the list currently shown
let editingId = null;  // null = adding a new person, number = editing


loadStudents();