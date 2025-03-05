<template>
  <div class="container">
    <!-- Barra de Pesquisa -->
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="input-group">
        <input 
          type="text" 
          v-model="searchQuery" 
          class="form-control" 
          placeholder="Buscar..." 
          @input="fetchData"
        />
        <button class="btn btn-outline-primary">
          <i class="fa fa-search"></i>
        </button>
        <!-- Controles de Paginação -->
      </div>
      <div>
        <button 
          class="btn btn-sm btn-outline-secondary me-2"
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          <i class="fa-solid fa-angle-left"></i>
        </button>
        <span>Página {{ currentPage }}</span>
        <button 
          class="btn btn-sm btn-outline-secondary ms-2" 
          :disabled="!hasNextPage" 
          @click="changePage(currentPage + 1)"
        >
          <i class="fa-solid fa-angle-right"></i>
        </button>
      </div>
    </div>

    <!-- Tabela -->
    <table class="table table-striped">
      <thead>
        <tr>
          <th v-for="(header, index) in headers" :key="index">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data" :key="item.id">
          <!-- Slot para personalizar cada linha -->
          <slot :row="item"></slot>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  props: {
    apiUrl: {
      type: String,
      required: true,
    },
    headers: {
      type: Array,
      required: true,
    },
    perPage: {
      type: Number,
      default: 10,
    },
  },
  data() {
    return {
      data: [],
      searchQuery: '',
      currentPage: 1,
      hasNextPage: false,
    };
  },
  methods: {
    async fetchData() {
      try {
        const response = await fetch(`${this.apiUrl}?limit=${this.perPage}&page=${this.currentPage}&search=${this.searchQuery}`);
        const result = await response.json();
        
        this.data = result.data;
        this.hasNextPage = result.hasNextPage;
      } catch (error) {
        console.error("Erro ao buscar os dados:", error);
      }
    },
    changePage(page) {
      this.currentPage = page;
      this.fetchData();
    }
  },
  mounted() {
    this.fetchData();
  },
};
</script>
