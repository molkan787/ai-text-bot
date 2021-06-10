<template>
  <v-app>
    <v-app-bar app color="#1c1b1b" dark elevation="1" >
      AI Text Bot
      <!-- <v-spacer></v-spacer>
      <v-btn @click="logoutClick" :loading="loggingOut" light elevation="1">Logout</v-btn> -->
    </v-app-bar>
    <v-content>
      <v-card class="content" elevation="0">
        <HomePage />
      </v-card>
    </v-content>
    <Dialog />
  </v-app>
</template>

<script>
import HomePage from './components/HomePage'
import Dialog from './components/Dialog'

export default {
  name: 'App',

  components: {
    HomePage,
    Dialog
  },
  data:() => ({
    loggingOut: false,
  }),
  methods: {
    async logoutClick(){
      if(await confirm('Are you sure you want to logout?')){
        this.loggingOut = true;
        await actions.logoutVscoUser();
        this.loggingOut = false;
        window.location.reload();
      }
    }
  }
};
</script>

<style scoped>
.content{
  padding: 20px;
  height: 100%;
}
</style>

<style>
html, body{
  overflow: hidden !important;
}
*:not(input){
  user-select: none;
}
h1, h2, h3, h4, h5, h6, div, p, span:not(.v-btn__content), label{
  cursor: default;
}
</style>