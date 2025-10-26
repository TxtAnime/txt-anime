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
	status: <string>,
	statusDesc: <string>
}
```
- status: 字符串枚举值，值有 `doing`、`done`
- statusDesc: status字段的描述， 比如 status `doing` 的时候， statusDesc 可能是“剧本生成中”、“场景图片生成中” 之类

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
			narrationVoiceURL: <string>,
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
	- imageURL：场景的图片url地址
	- narration：场景的旁白
	- narrationVoiceURL：场景的旁白的语音url地址
	- dialogues：场景中的对话列表
    	- character：角色名称
    	- line：角色台词
    	- voiceURL：角色台词的语音url地址

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
			status: <string>,
			statusDesc: <string>
		},
		...
	]
}
```

## 删除任务

```
请求

DELETE /v1/tasks/:id

响应

{
	success: <boolean>,
	message: <string>
}
```