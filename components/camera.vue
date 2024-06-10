<template>
  <object id="camera" data="http://localhost:8000/stream" type="image/png">
    <img src="/nostream.png">
  </object>
</template>

<style>
    #camera {
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: black;
    }

    img {
      position: absolute;
      width: 100%;
      height: 100%;
      object-fit: fill;
    }
</style>
