# novel2comic api

## 创建任务

```
请求

POST /v1/tasks/

{
	name: <string>,
	novel: <string>
}

响应

{
	id: <string>
}
```

## 获取任务

```
请求

GET /v1/tasks/:id

响应

{
	id: <string>,
	name: <string>,
	status: <string>
}
```
- status: 字符串枚举值，值有 `doing`、`done`

## 获取任务产物

```
请求

GET /v1/tasks/:id/artifacts

响应

{
	scenes: [
		{
			imageURL: <string>,
			narration: <string>,
			dialogues: [
				{
					character: <string>,
					line: <string>,
					voiceURL: <string>
				},
				...
			]
		},
		...
	]
}
```

- scenes：场景列表
	- image：场景的图片，base64 编码的 png 格式
	- narration：场景的旁白
	- dialogues：场景中的对话列表
    	- character：角色名称
    	- line：角色台词
    	- voice：角色台词的语音，base64 编码

## 获取任务列表

```
请求

GET /v1/tasks/

响应

{
	tasks: [
		{
			id: <string>,
			name: <string>,
			status: <string>
		},
		...
	]
}
```