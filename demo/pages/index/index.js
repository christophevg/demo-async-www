var Index = {
  template : `
<div>
  <div>
    <span style="float:right">server clock skew = {{ skew }}ms</span>
    <v-btn :loading="working" @click="send_sync()" class="primary">synchronous</v-btn>
    <v-btn :loading="working" @click="send_async()" class="primary">asynchronous</v-btn>
    <v-btn :loading="working" @click="get_skew()" class="primary">get clock skew</v-btn>
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
    },
    skew : function() {
      return store.getters.skew;
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
    },
    get_skew: function() {
      this.working = true;
      var self = this;

      var offsets = [];
      var counter = 0;
      var maxTimes = 10;
      var beforeTime = null;

      // get average 
      var mean = function(array) {
        var sum = 0;
        array.forEach(function (value) {
          sum += value;
        });
        return sum/array.length;
      }
      function getter() {
        beforeTime = Date.now();
        $.ajax( {
          url: "/api/time",
          type: "get",
          success: function(response) {
            var now = Date.now(),
                rtt = now - beforeTime,
                serverTime = response.time - rtt/2,
                offset = beforeTime - serverTime;
            counter++;
            offsets.push(offset)
            if (counter < maxTimes) {
              getter();
            } else {
              var averageOffset = mean(offsets);
              console.log("average offset:" + averageOffset);
              store.commit("skew", averageOffset);
              self.working = false;
            }
          },
          error: function(response) {
            app.$notify({
              group: "notifications",
              title: "Could not adjust time...",
              text:  response.responseText,
              type:  "warn",
              duration: 10000
            });
            self.working = false;
          }
        });
      }
      getter();
    }
  },
  data: function() {
    return {
      working: false,
      isValid : true,
    }
  },
  navigation: {
    icon:    "home",
    text:    "Test",
    path:    "/"
  },
};

Navigation.add(Index);

// set up page specific part in the store

store.registerModule("Index", {
  state: {
    log: [],
    skew: 0
  },
  mutations: {
    log: function(state, msg) {
      now = Date.now()
      msg["log"]["commit"] = now;
      msg["log"]["received"] = Math.round(msg["log"]["received"] + state.skew);
      msg["elapsed"] = now - msg["log"]["received"];
      state.log.unshift({ when: new Date(), body: msg });
    },
    skew: function(state, diff) {
      state.skew = diff;
    }
  },
  getters: {
    logs: function(state) {
      return state.log;
    },
    skew: function(state) {
      return state.skew;
    }
  }
});

socket.on("log", function(msg){
  store.commit("log", msg);
});
