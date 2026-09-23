const form=document.getElementById('contactForm');
form.addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(form);
  const name=String(data.get('name')||'').trim();
  const email=String(data.get('email')||'').trim();
  const message=String(data.get('message')||'').trim();
  const subject=encodeURIComponent(`Portfolio message from ${name}`);
  const body=encodeURIComponent(`${message}\n\n— ${name}\n${email}`);
  document.getElementById('formNote').textContent='Opening your email app with the message ready to send.';
  window.location.href=`mailto:krsachin9876@gmail.com?subject=${subject}&body=${body}`;
});
