module.exports = {
  "presets": [
    ["@babel/env", {
      "targets": {
        "browsers": "last 2 versions, ie >= 11"
      },
    	"modules": false
    }]
  ],
  "plugins": [
		["@babel/plugin-proposal-class-properties", { "loose": true }]
	],
  "exclude": "node_module/**",
  "env": {
    "test": {
      "presets": [
        [
          "@babel/env",
          { targets: { node: true } }
        ],
        [
          '@babel/preset-react'
        ]
      ]
    }
  }
}