"use strict";

function pickWhatsappPhone(student) {
  const raw = student.guardian?.phone || student.contact || "";
  const phone = String(raw).replace(/\D/g, "");
  return phone; // só números
}

function openWhatsappToStudent(student, extraMsg = "") {
  const phone = pickWhatsappPhone(student);
  if (!phone) {
    alert("Esse aluno não tem telefone válido (aluno ou responsável).");
    return;
  }

  const staff = getAttendanceStaffByNucleus(student.nucleus);
  const date = staff.classDate ? formatDateLabel(staff.classDate) : formatDateLabel(isoToday());
  const schedule = staff.classSchedule || "(horário não definido)";

  const alertInfo = getStudentAlertLevel(student);
  const base = [
    `Olá! Aqui é do Instituto Irmãos Nogueira (IIN).`,
    `Aluno(a): ${student.name}`,
    `Núcleo: ${student.nucleus}`,
    `Turma: ${schedule}`,
    `Data referência: ${date}`,
    alertInfo.level !== "ok" ? `⚠️ Alerta: ${alertInfo.reason}` : "",
    extraMsg ? `Obs: ${extraMsg}` : "",
    "",
    `Podemos conversar para apoiar a presença e evolução do(a) aluno(a)?`,
  ].filter(Boolean).join("\n");

  window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(base)}`, "_blank");
}

/* ========= WHATSAPP ========= */
function hydrateWhatsStudents() {
  if (!ui.whatsStudent) return;
  const current = ui.whatsStudent.value || "";
  const students = getProjectStudents().sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  ui.whatsStudent.innerHTML = "";
  students.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.name} (${s.nucleus})`;
    ui.whatsStudent.appendChild(opt);
  });
  if ([...ui.whatsStudent.options].some((o) => o.value === current)) ui.whatsStudent.value = current;
}

function onOpenWhatsapp(event) {
  event.preventDefault();
  const student = getProjectStudents().find((s) => s.id === ui.whatsStudent?.value);
  if (!student) return;

  const rawPhone = student.contact || student.guardian?.phone || "";
  const phone = rawPhone.replace(/\D/g, "");
  const msg = encodeURIComponent(ui.whatsMessage?.value?.trim() || `Olá ${student.name}, lembramos da sua próxima aula no IIN.`);

  if (!phone) {
    if (ui.whatsStatus) ui.whatsStatus.textContent = "Contato sem número de telefone válido.";
    return;
  }

  window.open(`https://wa.me/55${phone}?text=${msg}`, "_blank");
  if (ui.whatsStatus) ui.whatsStatus.textContent = `WhatsApp aberto para ${student.name}.`;
}

function buildTeacherWhatsappText(nucleus) {
  const staff = getAttendanceStaffByNucleus(nucleus);
  const date = staff.classDate ? formatDateLabel(staff.classDate) : "(data não definida)";
  const schedule = staff.classSchedule || "(horário não definido)";
  const students = getProjectStudents()
    .filter((s) => s.nucleus === nucleus)
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const lines = [
    `*IIN • Chamada ${nucleus}*`,
    `Data: ${date}`,
    `Horário: ${schedule}`,
    "",
    "*Lista:*",
  ];

  students.forEach((s, i) => lines.push(`${String(i + 1).padStart(2, "0")}. ${s.name} — ${attendanceCode(s.attendance)}`));
  return lines.join("\n");
}

function onTeacherWhatsapp() {
  const user = currentUser();
  if (!user || user.role !== "professor") return;

  const settings = ensureProjectSettings();
  const groupLink = (settings.whatsappGroupLink || "").trim();

  // se tiver link do grupo configurado, abre o grupo. Se não, abre WhatsApp com texto
  if (groupLink) {
    window.open(groupLink, "_blank");
    pushNucleusLog(user.nucleus, "WhatsApp grupo", "Professor abriu link do grupo", user);
    persist();
    return;
  }

  const text = buildTeacherWhatsappText(user.nucleus);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  pushNucleusLog(user.nucleus, "WhatsApp", "Professor abriu texto pronto", user);
  persist();
}

function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  } else fallbackCopy(text);

  function fallbackCopy(t) {
    const ta = document.createElement("textarea");
    ta.value = t;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}


/* ========= ADMIN CONFIG (grupo) ========= */
function onAdminSaveGroupLink() {
  const user = currentUser();
  if (!user || user.role !== "admin") return;

  const input = el("adminWhatsGroupLink");
  const status = el("adminWhatsGroupStatus");
  const link = (input?.value || "").trim();

  const settings = ensureProjectSettings();
  settings.whatsappGroupLink = link;

  persist();
  if (status) status.textContent = link ? "Link do grupo salvo com sucesso." : "Link removido.";
}


function fmtDateBR(iso) {
  if (!iso) return "";
  // se vier "2026-03-03T..." pega só a parte da data
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${day}/${m}/${y}`;
}

function statusLabel(s) {
  const v = String(s || "novo").toLowerCase();
  if (v === "confirmado") return "🟢 Confirmada";
  if (v === "aguardando") return "🟡 Aguardando";
  if (v === "sem_resposta") return "🔴 Sem resposta";
  return "🟡 Aguardando";
}

function waLink(phone, msg) {
  const p = String(phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(msg || "");
  return `https://wa.me/55${p}?text=${text}`;
}

function abrirWhatsApp(phone, encMsg) {
  const p = String(phone || "").replace(/\D/g, "");
  if (!p) return alert("Sem WhatsApp do responsável.");
  const msg = decodeURIComponent(encMsg || "");
  window.open(`https://wa.me/55${p}?text=${encodeURIComponent(msg)}`, "_blank");
}
