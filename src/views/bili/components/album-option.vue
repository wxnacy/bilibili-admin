<template>
  <span>
    <el-select
      v-model="listQuery.manage_name"
      placeholder="Manage"
      clearable
      class="filter-item"
      style="width: 130px"
      @change="albumChange"
    >
      <el-option v-for="item in albumOptions" :key="item.id" :label="item.title" :value="item.id" />
    </el-select>

    <el-select
      v-model="listQuery.season"
      placeholder="季数"
      clearable
      class="filter-item"
      style="width: 130px"
      @change="seasonChange"
    >
      <el-option v-for="item in albumSeasonOptions" :key="item.id" :label="item.title+'('+item.id+')'" :value="item.id" />
    </el-select>

    <el-select v-model="listQuery.episode" placeholder="Episode" clearable class="filter-item" style="width: 130px">
      <el-option v-for="item in episodeOptions" :key="item.ep" :label="item.ep + '-' + item.title" :value="item.ep" />
    </el-select>
  </span>
</template>

<script>
import { loadAlbumOptions, loadAlbumSeasonOptions, loadEpisodeOptions } from '@/api/bili'

export default {
  name: 'AlbumOption',
  props: {
    value: {
      type: Object,
      default: null
    }
  },
  setup(props) {
    console.log(props)
  },
  /* components: {  }, */
  data() {
    return {
      listQuery: this.value,
      albumOptions: null,
      albumSeasonOptions: null,
      episodeOptions: null
    }
  },
  watch: {
    listQuery(val) {
      this.$emit('input', val)
    }
  },
  created() {
    loadAlbumOptions(this)
    this.albumChange()
  },
  methods: {
    albumChange() {
      console.log(this.listQuery)
      loadAlbumSeasonOptions(this)
    },
    seasonChange() {
      console.log(this.listQuery)
      loadEpisodeOptions(this)
    }
  }
}
</script>
