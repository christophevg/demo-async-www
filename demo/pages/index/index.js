var Index = {
  template : `
<div>
  <div>
    <v-btn :loading="working" @click="send_sync()" class="primary">synchronous</v-btn>
    <v-btn :loading="working" @click="send_async()" class="primary">asynchronous</v-btn>
  </div>
  <hr style="margin-bottom:20px;margin-top:20px;">
  <h2>Log</h2>
  <v-expansion-panel popout>
    <v-expansion-panel-content v-for="(message, i) in messages" :key="i" hide-actions>
      <v-layout slot="header" align-left row spacer>
        <div>
          <span class="grey--text">{{ message.when | formatDate }}</span>
          <br>
          <div v-html="$options.filters.syntaxHighlight(message.body, 250)"></div>
        </div>
      </v-layout>
    </v-expansion-panel-content> 
  </v-expansion-panel>
</div>
`,
  computed: {
    messages : function() {
      return store.getters.logs;
    }
  },
  methods: {
    handleValidation:function(isValid, errors){
      this.isValid = isValid;
    },
    send_sync: function() {
      this.working = true;
      var self = this;
      $.ajax( {
        url: "/api/handle/sync",
        type: "post",
        data: JSON.stringify( { "body" : "hello synchronous world" } ),
        dataType: "json",
        contentType: "application/json",
        success: function(response) {
          self.working = false;
          store.commit("log", response);
        },
        error: function(response) {
          app.$notify({
            group: "notifications",
            title: "Could not handle...",
            text:  response.responseText,
            type:  "warn",
            duration: 10000
          });
          self.working = false;
        }
      });
    },
    send_async: function() {
      this.working = true;
      var self = this;
      $.ajax( {
        url: "/api/handle/async",
        type: "post",
        data: JSON.stringify( { "body" : "hello asynchronous world" } ),
        dataType: "json",
        contentType: "application/json",
        success: function(response) {
          self.working = false;
        },
        error: function(response) {
          app.$notify({
            group: "notifications",
            title: "Could not handle...",
            text:  response.responseText,
            type:  "warn",
            duration: 10000
          });
          self.working = false;
        }
      });
    }
  },
  data: function() {
    return {
      working: false,
      isValid : true,
    }
  }
};

// add route and navigation entry

router.addRoutes([
  { path: '/', component: Index },
])

app.sections.push({
  icon  : "home",
  text  : "Index",
  path  : "/"    
});


// set up page specific part in the store

store.registerModule("Index", {
  state: {
    log: []
  },
  mutations: {
    log: function(state, msg) {
      now = Date.now()
      msg["log"]["commit"] = now;
      msg["elapsed"] = now - msg["log"]["received"];
      state.log.unshift({ when: new Date(), body: msg });
    }
  },
  getters: {
    logs: function(state) {
      return state.log;
    }
  }
});

socket.on("log", function(msg){
  store.commit("log", msg);
});
