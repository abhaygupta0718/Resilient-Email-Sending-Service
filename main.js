document.getElementById('emailForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('emailId').value;
  const to = document.getElementById('emailTo').value;
  const subject = document.getElementById('emailSubject').value;
  const body = document.getElementById('emailBody').value;

  const result = await window.emailService.sendEmail({ id, to, subject, body });

  document.getElementById('result').innerText = result;
  document.getElementById('logOutput').innerText = window.emailService.getLogs();
});
