
export default {
  // props: [],

  // Properties returned from data() become reactive state
  // and will be exposed on `this`.
  data() {
    return {
      count: 0,
      token: document.getElementById("app").getAttribute("token")
    }
  },

  // Methods are functions that mutate state and trigger updates.
  // They can be bound as event listeners in templates.
  methods: {
    increment() {
      this.count++
    }
  },

  // Lifecycle Hooks are called at different stages
  // of a component's lifecycle.

  beforeCreate() {},
  created() {},
  beforeMount() {},
  mounted() {},
  beforeUpdate() {},
  updated() {},
  beforeUnmount() {},
  unmounted() {},
  errorCaptured() {},
  renderTracked() {},
  renderTriggered() {},
  activated() {},
  deactivated() {},
  serverPrefetch() {},



  template: `
      <h1>Sign up</h1>
			<form action="/signup" method="post">
				<section>
					<label for="username">Username</label>
					<input id="username" name="username" type="text" autocomplete="username" required>
				</section>
				<section>
					<label for="email">Email</label>
					<input id="email" name="email" type="email" autocomplete="username" required>
				</section>				
				<section>
					<label for="new-password">Password</label>
					<input id="new-password" name="password" type="password" autocomplete="new-password" required>
				</section>
				<input type="hidden" name="_csrf" :value="token">
				<button type="submit">Sign up</button>
			</form>
			<hr>
			<p class="help">Already have an account? <a href="/login">Sign in</a></p>
`
}