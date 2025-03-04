<template>
  <div class="container">
    <div class="d-flex justify-content-end align-items-center gap-2">
      <section class="input-group">
        <input type="text" v-model="tableData.searchQuery" class="form-control">
        <button class="btn btn-outline-primary" type="button" id="button-addon2"><i class="fa fa-search"></i></button>
      </section>
      <section>
        <ul class="pagination">
          <li class="page-item" :class="{ disabled: tableData.currentPage === 1 }">
            <button class="page-link" @click="goToPage(1)"><i class="fa-solid fa-angles-left"></i></button>
          </li>
          <li class="page-item" :class="{ disabled: tableData.currentPage === 1 }">
            <button class="page-link" @click="prevPage"><i class="fa-solid fa-angle-left"></i></button>
          </li>
          <li class="page-item active">
            <span class="page-link">{{ tableData.currentPage }}</span>
          </li>
          <li class="page-item">
            <button class="page-link" @click="nextPage"><i class="fa-solid fa-angle-right"></i></button>
          </li>
        </ul>
      </section>
    </div>
    <table class="table table-striped">
      <thead>
        <tr>
          <th v-for="(header, index) in headers" :key="index">{{ header }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="tableData.items" v-for="(item, index) in tableData.items" :key="index">
          <td v-for="(value, key) in item" :key="key">{{ value }}</td>
        </tr>
      </tbody>
    </table>
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
    tableData: {
      items: [],
      currentPage: 1,
      searchQuery: "",
      perPage: 10,
    }
  };
},
methods: {
  async fetchData() {
    let url = this.apiUrl + `?limit=${this.tableData.perPage}&page=${this.tableData.currentPage}`;

    if (this.tableData.searchQuery) {
      url += `&search=${this.tableData.searchQuery}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    console.log("TableSkeleton load data: " + JSON.stringify(data));
    this.tableData.items = data.clients;
  },
  goToPage(page) {
    if (page >= 1) {
      this.tableData.currentPage = page;
      this.fetchData();
    }
  },
  prevPage() {
    if (this.tableData.currentPage > 1) {
      this.tableData.currentPage--;
      this.fetchData();
    }
  },
  nextPage() {
    this.tableData.currentPage++;
    this.fetchData();
  }
},
async mounted() {
  await this.fetchData();
}
};
</script>