<script setup>
import {ref, watch, onMounted, onUnmounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {supabase} from '../supabase'
import CryptoJS from 'crypto-js'

const router = useRouter()
const route = useRoute()

const sessionCode = ref('')
const textContent = ref('')

onMounted(() => {
  sessionCode.value = route.params.sessionCode.toLowerCase().trim()
  loadContent()
  subscribeToChanges()
})

onUnmounted(() => {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
})

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

const loadContent = async () => {
  try {
    const {data} = await supabase
        .from('clipboards')
        .select('content')
        .eq('room_code', sessionCode.value)
        .maybeSingle()

    if (data && data.content) {
      textContent.value = decrypt(data.content, sessionCode.value)
      console.log('Contenu déchiffré et chargé')
    }
  } catch (err) {
    console.error('Erreur:', err)
  }
}

let channel = null
let isReceivingBroadcast = false

const subscribeToChanges = () => {
  channel = supabase.channel(`room:${sessionCode.value}`)

  channel
      .on('broadcast', {event: 'text-update'}, (payload) => {
        console.log('Broadcast chiffré reçu')
        isReceivingBroadcast = true
        textContent.value = decrypt(payload.payload.content, sessionCode.value)
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
  if (isReceivingBroadcast) {
    console.log('Skipping save (receiving broadcast)')
    return
  }

  clearTimeout(saveTimeout)
  saveTimeout = setTimeout(async () => {
    try {
      console.log('Chiffrement et sauvegarde...')
      const encrypted = encrypt(newValue, sessionCode.value)

      await supabase
          .from('clipboards')
          .upsert({
            room_code: sessionCode.value,
            content: encrypted,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'room_code'
          })

      if (channel) {
        await channel.send({
          type: 'broadcast',
          event: 'text-update',
          payload: {content: encrypted}
        })
        console.log('Broadcast chiffré envoyé')
      }
    } catch (err) {
      console.error('Erreur:', err)
    }
  }, 500)
})

const disconnect = () => {
  if (channel) {
    supabase.removeChannel(channel)
    channel = null
  }
  router.push('/')
}
</script>

<template>
  <div class="editor">
    <div class="header">
      <span>Session: {{ sessionCode }}</span>
      <button @click="disconnect">Déconnecter</button>
    </div>
    <textarea
        v-model="textContent"
        placeholder="Votre texte ici..."
    ></textarea>
  </div>
</template>

<style scoped>
.editor {
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #222;
  border-bottom: 1px solid #404040;
  flex-shrink: 0;
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
  flex: 1;
  padding: 20px;
  background: #2a2a2a;
  border: none;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  outline: none;
  color: #e0e0e0;
}

.editor textarea::placeholder {
  color: #666;
}
</style>
