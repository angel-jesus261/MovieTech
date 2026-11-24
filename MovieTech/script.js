const money = n => `S/ ${Number(n).toFixed(2)}`;
const formatDate = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-PE',{weekday:'short',day:'numeric',month:'short',year:'numeric'}) : 'Elige una fecha';
const today = new Date(); const todayISO = new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);

if (document.body.dataset.page === 'cartelera') {
  let selected = null;
  const cards = [...document.querySelectorAll('.movie-card')];
  const name = document.getElementById('chosenMovie');
  const price = document.getElementById('chosenPrice');
  const next = document.getElementById('continueToBooking');
  cards.forEach(card => card.addEventListener('click', () => {
    cards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selected = { name: card.dataset.movie, price: Number(card.dataset.price), poster: card.dataset.poster };
    name.textContent = selected.name;
    price.textContent = `${money(selected.price)} por entrada`;
    next.disabled = false;
  }));
  next.addEventListener('click', () => {
    if (!selected) return;
    sessionStorage.setItem('cinenovaMovie', JSON.stringify(selected));
    window.location.href = 'dulceria.html';
  });
}

if (document.body.dataset.page === 'compra') {
  const movie = JSON.parse(sessionStorage.getItem('cinenovaMovie') || 'null');
  const bookingMovie = document.getElementById('bookingMovie');
  const summaryMovie = document.getElementById('summaryMovie');
  const ticketPrice = movie ? movie.price : 0;
  const snackPrices = {popcorn:12,soda:9,chocolate:6,combo:36};
  const snackNames = {popcorn:'Cancha clásica',soda:'Gaseosa grande',chocolate:'Chocolate',combo:'Combo pareja'};
  const snacks = {popcorn:0,soda:0,chocolate:0,combo:0};
  let seats = [];
  const occupied = new Set(['A4','A5','B2','B8','C3','C7','D1','D9','E5','F4','F6']);
  const showDate = document.getElementById('showDate');
  const showTime = document.getElementById('showTime');
  const seatMap = document.getElementById('seatMap');
  const hint = document.getElementById('seatHint');

  if (!movie) {
    bookingMovie.textContent = 'Primero elige una película';
    summaryMovie.textContent = 'Película no seleccionada';
    document.getElementById('bookingGenre').textContent = 'Regresa a la cartelera para comenzar';
    document.getElementById('bookingTicketPrice').textContent = '';
    document.getElementById('checkoutBtn').disabled = true;
  } else {
    bookingMovie.textContent = movie.name;
    summaryMovie.textContent = movie.name;
    document.getElementById('bookingTicketPrice').textContent = `${money(movie.price)} por entrada`;
    const thumb = document.getElementById('summaryThumb');
    const art = document.getElementById('chosenFilmArt');
    thumb.textContent = '▶'; art.textContent = '▶';
    // Poster styling remains as a designed fallback until the cinema uploads its licensed poster artwork.
  }
  showDate.min = todayISO; showDate.value = todayISO;

  function renderSeats() {
    ['A','B','C','D','E','F'].forEach(row => {
      const label = document.createElement('span'); label.className='seat-row-label'; label.textContent=row; seatMap.appendChild(label);
      for(let n=1;n<=8;n++){
        const id=row+n; const btn=document.createElement('button'); btn.type='button'; btn.className='seat'; btn.textContent=n;
        if(occupied.has(id)){btn.classList.add('occupied');btn.disabled=true;btn.title='Butaca ocupada';}
        else {btn.title=`Butaca ${id}`;btn.addEventListener('click',()=>{
          if(seats.includes(id)){seats=seats.filter(x=>x!==id);btn.classList.remove('selected');}
          else if(seats.length<8){seats.push(id);btn.classList.add('selected');}
          else {hint.textContent='Puedes elegir como máximo 8 butacas.';return;}
          hint.textContent=seats.length?`${seats.length} butaca(s) seleccionada(s).`:'Puedes seleccionar hasta 8 butacas.';
          update();
        });}
        seatMap.appendChild(btn);
      }
    });
  }
  function update() {
    const ticketTotal=seats.length*ticketPrice;
    const snackTotal=Object.entries(snacks).reduce((s,[k,q])=>s+snackPrices[k]*q,0);
    document.getElementById('summaryDate').textContent=formatDate(showDate.value);
    document.getElementById('summaryTime').textContent=showTime.options[showTime.selectedIndex].text;
    document.getElementById('seatCount').textContent=`(${seats.length})`;
    document.getElementById('selectedSeats').textContent=seats.length?[...seats].sort().join(' · '):'Aún no has elegido';
    document.getElementById('ticketTotal').textContent=money(ticketTotal);
    document.getElementById('snackTotal').textContent=money(snackTotal);
    document.getElementById('grandTotal').textContent=money(ticketTotal+snackTotal);
  }
  document.querySelectorAll('[data-snack]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.snack;snacks[key]=Math.max(0,Math.min(10,snacks[key]+Number(btn.dataset.change)));
    document.getElementById(`${key}Qty`).textContent=snacks[key];update();
  }));
  showDate.addEventListener('change',update);showTime.addEventListener('change',update);
  document.getElementById('checkoutBtn').addEventListener('click',()=>{
    if(!movie){alert('Primero selecciona una película en la cartelera.');return;}
    if(!showDate.value){alert('Selecciona la fecha de tu función.');showDate.focus();return;}
    if(new Date(`${showDate.value}T00:00:00`)<new Date(`${todayISO}T00:00:00`)){alert('La fecha no puede ser anterior a hoy.');return;}
    if(!seats.length){alert('Selecciona al menos una butaca.');seatMap.scrollIntoView({behavior:'smooth',block:'center'});return;}
    const snackLines=Object.entries(snacks).filter(([,q])=>q>0).map(([k,q])=>`${snackNames[k]} x${q}: ${money(snackPrices[k]*q)}`);
    const total=seats.length*ticketPrice+Object.entries(snacks).reduce((s,[k,q])=>s+snackPrices[k]*q,0);
    document.getElementById('receipt').innerHTML=`
      <div><strong>PELÍCULA</strong><br>${movie.name}</div>
      <div><strong>FECHA Y HORA</strong><br>${formatDate(showDate.value)} · ${showTime.options[showTime.selectedIndex].text}</div>
      <div><strong>BUTACAS</strong><br>${[...seats].sort().join(', ')}</div>
      <div><strong>DULCERÍA</strong><br>${snackLines.length?snackLines.join('<br>'):'Sin productos añadidos'}</div>
      <div style="border-top:1px solid #343747;margin-top:9px;padding-top:9px"><strong>TOTAL: ${money(total)}</strong></div>
      <div style="color:#9296a5;font-size:9px">Código de reserva: CN-${Math.random().toString(36).slice(2,8).toUpperCase()}</div>`;
    document.getElementById('purchaseModal').classList.remove('hidden');
  });
  const close=()=>document.getElementById('purchaseModal').classList.add('hidden');
  document.getElementById('closeModal').addEventListener('click',close);
  document.getElementById('finishBtn').addEventListener('click',()=>{close();window.location.href='index.html';});
  document.getElementById('purchaseModal').addEventListener('click',e=>{if(e.target.id==='purchaseModal')close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  renderSeats();update();
}
