<script setup>
import {ref, watch} from 'vue'
import {supabase} from './supabase'

const roomCode = ref('')
const currentRoom = ref('')
const textContent = ref('')
const isConnected = ref(false)

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const createNewSession = () => {
  roomCode.value = generateCode()
  joinSession()
}

const joinSession = async () => {
  if (!roomCode.value.trim()) return

  const code = roomCode.value.trim().toUpperCase()
  currentRoom.value = code
  isConnected.value = true

  await loadContent()
  subscribeToChanges()
}

const loadContent = async () => {
  try {
    const {data} = await supabase
        .from('clipboards')
        .select('content')
        .eq('room_code', currentRoom.value)
        .maybeSingle()

    if (data) {
      textContent.value = data.content || ''
    }
  } catch (err) {
    console.error('Erreur:', err)
  }
}

let channel = null
let isReceivingBroadcast = false

const subscribeToChanges = () => {
  // Créer un channel Realtime avec broadcast
  channel = supabase.channel(`room:${currentRoom.value}`)

  // Écouter les messages broadcast
  channel
      .on('broadcast', {event: 'text-update'}, (payload) => {
        console.log('Broadcast received')
        // Flag pour éviter de déclencher le watch
        isReceivingBroadcast = true
        textContent.value = payload.payload.content
        setTimeout(() => {
          isReceivingBroadcast = false
        }, 100)
      })
      .subscribe((status) => {
        console.log('Channel status:', status)
      })
}

let saveTimeout = null
watch(textContent, (newValue) => {
  // Ne pas sauvegarder si on reçoit un broadcast
  if (!isConnected.value || isReceivingBroadcast) {
    console.log('Skipping save (receiving broadcast)')
    return
  }

  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    try {
      console.log('Saving...')
      // Sauvegarder dans la DB
      await supabase
          .from('clipboards')
          .upsert({
            room_code: currentRoom.value,
            content: newValue,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'room_code'
          })

      // Envoyer un broadcast aux autres clients
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'text-update',
          payload: { content: newValue }
        })
        console.log('Broadcast sent')
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }, 500)
})

const disconnect = () => {
  isConnected.value = false
  currentRoom.value = ''
  roomCode.value = ''
  textContent.value = ''
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
}
</script>

<template>
  <div class="app">
    <!-- Connexion -->
    <div v-if="!isConnected" class="connect">
      <h1>Clipboard Sync</h1>
      <input
          v-model="roomCode"
          type="text"
          placeholder="Code de session"
          @keyup.enter="joinSession"
      />
      <button @click="joinSession">Rejoindre</button>
      <button @click="createNewSession">Nouvelle session</button>
    </div>

    <!-- Zone de texte -->
    <div v-else class="editor">
      <div class="header">
        <span>Session: {{ currentRoom }}</span>
        <button @click="disconnect">Déconnecter</button>
      </div>
      <textarea
          v-model="textContent"
          placeholder="Votre texte ici..."
      ></textarea>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background: #1a1a1a;
}

.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.connect {
  background: #2a2a2a;
  padding: 40px;
  border-radius: 8px;
  text-align: center;
}

.connect h1 {
  margin-bottom: 20px;
  font-size: 24px;
  color: #e0e0e0;
}

.connect input {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  background: #1a1a1a;
  border: 1px solid #404040;
  border-radius: 4px;
  font-size: 16px;
  text-transform: uppercase;
  text-align: center;
  color: #e0e0e0;
}

.connect input::placeholder {
  color: #666;
}

.connect button {
  width: 100%;
  padding: 12px;
  margin-bottom: 10px;
  background: #404040;
  color: #e0e0e0;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.connect button:hover {
  background: #505050;
}

.connect button:last-child {
  background: #2a2a2a;
  color: #e0e0e0;
  border: 1px solid #404040;
}

.connect button:last-child:hover {
  background: #333;
}

.editor {
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #222;
  border-bottom: 1px solid #404040;
}

.header span {
  font-weight: 600;
  color: #e0e0e0;
}

.header button {
  padding: 8px 16px;
  background: #2a2a2a;
  border: 1px solid #404040;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #e0e0e0;
}

.header button:hover {
  background: #333;
}

.editor textarea {
  width: 100%;
  min-height: 500px;
  padding: 20px;
  background: #2a2a2a;
  border: none;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  outline: none;
  color: #e0e0e0;
}

.editor textarea::placeholder {
  color: #666;
}
</style>
