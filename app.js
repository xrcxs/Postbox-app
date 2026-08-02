const NAME_KEY = 'postbox_name_v1';
const ROOM_KEY = 'postbox_room_v1';

const nameGate = document.getElementById('nameGate');
const nameInputGate = document.getElementById('nameInputGate');
const roomInputGate = document.getElementById('roomInputGate');
const enterBtn = document.getElementById('enterBtn');

const app = document.getElementById('app');
const thread = document.getElementById('thread');
const emptyState = document.getElementById('emptyState');
const input = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const statusDot = document.getElementById('statusDot');
const peerName = document.getElementById('peerName');
const roomPill = document.getElementById('roomPill');

let myName = localStorage.getItem(NAME_KEY);
let roomCode = localStorage.getItem(ROOM_KEY);
let messagesRef = null;

function slugRoom(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function enterApp() {
  nameGate.style.display = 'none';
  app.style.display = 'flex';
  peerName.textContent = myName;
  roomPill.textContent = roomCode;

  firebase.auth().signInAnonymously().catch(err => {
    alert('Could not connect: ' + err.message);
  });

  firebase.database().ref('.info/connected').on('value', (snap) => {
    statusDot.classList.toggle('offline', !snap.val());
  });

  messagesRef = firebase.database().ref('rooms/' + roomCode + '/messages');

  messagesRef.limitToLast(200).on('child_added', (snap) => {
    appendMessage(snap.val());
  });
}

function appendMessage(msg) {
  emptyState.remove();

  const row = document.createElement('div');
  row.className = 'bubble-row ' + (msg.sender === myName ? 'mine' : 'theirs');

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = msg.text;

  const stamp = document.createElement('span');
  stamp.className = 'stamp';
  const time = new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  stamp.textContent = (msg.sender === myName ? '' : msg.sender + ' · ') + time;
  bubble.appendChild(stamp);

  row.appendChild(bubble);
  thread.appendChild(row);
  thread.scrollTop = thread.scrollHeight;
}

function sendMessage() {
  const text = input.value.trim();
  if (!text || !messagesRef) return;

  messagesRef.push({
    sender: myName,
    text,
    ts: Date.now()
  });

  input.value = '';
  autoGrow();

  sendBtn.classList.remove('pop');
  void sendBtn.offsetWidth;
  sendBtn.classList.add('pop');
}

function autoGrow() {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}

enterBtn.addEventListener('click', () => {
  const name = nameInputGate.value.trim();
  const room = slugRoom(roomInputGate.value);
  if (!name || !room) {
    alert('Please enter both a name and a room code.');
    return;
  }
  myName = name;
  roomCode = room;
  localStorage.setItem(NAME_KEY, myName);
  localStorage.setItem(ROOM_KEY, roomCode);
  enterApp();
});

roomPill.addEventListener('click', () => {
  prompt('Share this room code with your friend:', roomCode);
});

sendBtn.addEventListener('click', sendMessage);

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

input.addEventListener('input', autoGrow);

if (myName && roomCode) {
  enterApp();
}