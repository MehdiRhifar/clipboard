<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'

const router = useRouter()
const roomCode = ref('')

const generateCode = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

const createNewSession = () => {
  const newCode = generateCode()
  router.push('/' + newCode)
}

const joinSession = () => {
  if (!roomCode.value.trim()) return
  const code = roomCode.value.trim().toLowerCase()

  router.push('/' + code)
}
</script>

<template>
  <div class="connect">
    <h1>Clipboard Sync</h1>
    <input
        v-model="roomCode"
        type="text"
        placeholder="Code de session"
        @keyup.enter="joinSession"
    />
    <button @click="joinSession">Rejoindre</button>
    <button @click="createNewSession">Nouvelle session aléatoire</button>
  </div>
</template>

<style scoped>
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
  text-transform: lowercase;
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
</style>
