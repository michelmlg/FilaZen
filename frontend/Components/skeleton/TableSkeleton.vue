<template>
    <div>
      <div class="d-flex justify-content-between mb-3">
        <input v-model="searchQuery" class="form-control w-25" placeholder="Buscar..." />
        <slot name="buttons"></slot>
      </div>
      <table class="table table-striped">
        <thead>
          <tr>
            <th v-for="(header, index) in headers" :key="index">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items" v-for="(item, index) in items" :key="index">
            <td v-for="(value, key) in item" :key="key">{{ value }}</td>
          </tr>
        </tbody>
      </table>
      <nav>
        <ul class="pagination">
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link" @click="goToPage(1)"><i class="fa-solid fa-chevron-left"></i><i class="fa-solid fa-chevron-left"></i></button>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === 1 }">
            <button class="page-link" @click="prevPage"><i class="fa-solid fa-chevron-left"></i></button>
          </li>
          <li class="page-item active">
            <span class="page-link">{{ currentPage }}</span>
          </li>
          <li class="page-item" :class="{ disabled: currentPage === totalPages }">
            <button class="page-link" @click="nextPage"><i class="fa-solid fa-chevron-right"></i></button>
          </li>
        </ul>
      </nav>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      apiUrl: String,
      headers: Array,
    },
    data() {
      return {
        tableData:{
            items: [],
            currentPage: 1,
            searchQuery: "",
            perPage: { type: Number, default: 10 }
        }
      };
    },
    computed: {
      filteredData() {
        return this.items.filter(item =>
          Object.values(item).some(value =>
            String(value).toLowerCase().includes(this.searchQuery.toLowerCase())
          )
        );
      },
      totalPages() {
        return Math.ceil(this.items.length() / this.perPage);
      }
    },
    methods: {
      async fetchData() {
    

        const response = await fetch(this.apiUrl + `?limit=${this.perPage}&page=${this.currentPage}`);
        const data = await response.json();
        this.items = data;
      },
      goToPage(page) {
        if (page >= 1 && page <= this.totalPages) {
          this.currentPage = page;
        }
      },
      prevPage() {
        if (this.currentPage > 1) this.currentPage--;
      },
      nextPage() {
        if (this.currentPage < this.totalPages) this.currentPage++;
      }
    },
    mounted() {
      this.fetchData();
    }
  };
  </script>