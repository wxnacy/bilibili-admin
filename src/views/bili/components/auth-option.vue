<template>
  <span>
    <el-select
      v-model="listQuery.auth_user_id"
      placeholder="AuthUser"
      clearable
      class="filter-item"
      style="width: 130px"
    >
      <el-option v-for="item in authOptions" :key="item.mid" :label="item.uname" :value="item.mid" />
    </el-select>
  </span>
</template>

<script>
import { loadAuthOptions } from '@/api/bili'

export default {
  name: 'AuthOption',
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
      authOptions: null
    }
  },
  watch: {
    listQuery(val) {
      this.$emit('input', val)
    }
  },
  created() {
    loadAuthOptions(this)
  },
  methods: {
  }
}
</script>
