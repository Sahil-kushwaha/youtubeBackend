# Youtube fullstack clone with other functionalities

[Model link](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

# npm package used
1. `cookies-parser` 
2. `cors`
3. `mongoose-aggregate-paginate-v2` mongoose give facility to use mongo aggregation as plugin (A plugin is a software component that adds specific functionality to an existing computer program or web browser. Plugins are designed to extend the capabilities of the host application without requiring any changes to its core code.)
4. `bcrypt` to hash password {based on cryptography algorithm}
5. `jwt`  jsonwebtoken {based on cryptography algorithm check at jwt.io}[reference](https://stackoverflow.com/questions/31309759/what-is-secret-key-for-jwt-based-authentication-and-how-to-generate-it)
  1.`to create secret key`:- Use this CLI (node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# mongoose middleware
1. middleware (pre and post hooks)
2. Schema.methods
3. Schema.plugin
4. Document.prototype.isModified()