<script setup>
import {ref, watch} from 'vue'
import {supabase} from './supabase'
import CryptoJS from 'crypto-js'

const roomCode = ref('')
const currentRoom = ref('')
const textContent = ref('')
const isConnected = ref(false)

// Fonctions de chiffrement/déchiffrement
const encrypt = (text, key) => {
  if (!text) return ''
  return CryptoJS.AES.encrypt(text, key).toString()
}

const decrypt = (encryptedText, key) => {
  if (!encryptedText) return ''
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key)
    return bytes.toString(CryptoJS.enc.Utf8)
  } catch (err) {
    console.error('Déchiffrement échoué:', err)
    return ''
  }
}

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

  currentRoom.value = roomCode.value.trim().toUpperCase()
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

    if (data && data.content) {
      // Déchiffrer le contenu avec le code de session
      textContent.value = decrypt(data.content, currentRoom.value)
      console.log('Contenu déchiffré et chargé')
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
        console.log('Broadcast chiffré reçu')
        // Flag pour éviter de déclencher le watch
        isReceivingBroadcast = true
        // Déchiffrer le contenu avec le code de session
        textContent.value = decrypt(payload.payload.content, currentRoom.value)
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
      console.log('Chiffrement et sauvegarde...')
      // Chiffrer le contenu avec le code de session
      const encrypted = encrypt(newValue, currentRoom.value)

      // Sauvegarder le contenu CHIFFRÉ dans la DB
      await supabase
          .from('clipboards')
          .upsert({
            room_code: currentRoom.value,
            content: encrypted,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'room_code'
          })

      // Envoyer un broadcast avec le contenu CHIFFRÉ
      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'text-update',
          payload: { content: encrypted }
        })
        console.log('Broadcast chiffré envoyé')
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
