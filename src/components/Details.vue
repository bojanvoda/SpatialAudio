<template>
    <div class="modal-backdrop" style="z-index:99999" @click="close()">
      <div class="grid-container" v-if="details">
        <div class="image-container">
          <div class="image-centerer">
            <img class="image" :src="details.imageUrl" >
          </div>
   
        </div>
        <div class="description-container">
   
          <div class="title">{{details.name}}</div>
   
          <span class="label">DESCRIPTION</span>
          <div class="description">{{details.description}}</div>
   
        </div>
      </div>
   
   
    </div>
  </template>
   
  <script>
    export default {
      name: 'Details',
      props: ['details'],
      methods: {
        close() {
          this.$emit('close');
        },
      },
      mounted() {
        document.getElementsByClassName('modal-backdrop')[0].addEventListener('click', (e) => {
   
          e.stopPropagation();
        })
      }
    };
  </script>
   
  <style scoped>
   
    .close-btn {
      outline: none;
      border: none;
      cursor: pointer;
      position: fixed;
      height: 50px;
      width: 50px;
      border-radius: 25px;
      background: white;
      padding: 0;
      z-index: 101;
      top: 20px;
      right: 25px;
    }
   
    .grid-container {
      height: 100%;
      display: grid;
      grid-template-columns: 400px 1fr;
      grid-template-rows: 1fr;
      grid-column-gap: 0px;
      grid-row-gap: 0px;
    }
   
    .image-container { 
      grid-area: 1 / 2 / 2 / 3;
      background: radial-gradient(circle, rgba(0, 0, 0, 0.6) 0%, rgb(222, 222, 222) 26%, rgb(242, 239, 239) 100%);
      padding: 5%;
    }
   
    .image-centerer {
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }
   
    .image {
      width: 100%;
    }
   
    .description-container { 
      grid-area: 1 / 1 / 2 / 2;
      background: #191919;
      padding: 16px 24px 16px 32px;
      text-align: left;
    }
   
   
    @media screen and (max-width: 800px) {
      .grid-container {
        grid-template-columns: 1fr;
        grid-template-rows: 1fr 300px;
      }
   
   
      .image-container {
        grid-area: 1 / 1 / 2 / 2;
      } 
      .description-container {
        grid-area: 2 / 1 / 3 / 2;
      } 
    }
   
    .title {
      color: white;
      font-size: 32px;
      font-weight: 600;
      margin: 0 0 1rem;
    }
   
    .label {
      font-size: 11px;
      font-weight: 500;
      color: rgb(174, 174, 174);
    }
   
    .description {
      color: white;
      font-size: 14px;
      margin: 0;
    }
  </style>