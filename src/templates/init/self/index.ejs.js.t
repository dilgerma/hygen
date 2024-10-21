---
to: _templates/generator/demo/index.js.t
---
---
to: _templates/demo/events/index.js
---
var renderEvent = async (folder, slice, event, config, jsonConfig, renderFile)=>{
    return await renderFile(
        `${folder}/event.ejs.t`,
        config,
        {
            slice: slice,
            event: event.title?.replaceAll(" ",""),
            fields: event.fields.map(field => {
                return `var ${field.title}:string = null`
            })
        }
    )
}

module.exports = {
    prompt: ({inquirer, jsonConfig}) => {
        const questions = [
            {
                type: 'select',
                name: 'slice',
                message: 'What slice?',
                choices: jsonConfig?.slices?.map(it => it.title)||["none"]
            }
        ]
        return inquirer
            .prompt(questions)
            .then(answers => {
                return { ...answers }
            })
    },
    render: async (folder, args, jsonConfig, config, renderFile) => {
        let slice = jsonConfig?.slices?.find(item => item.title === args["slice"])
        var results = []
        for (let event of slice.events) {
             results.push(await renderEvent(folder, slice.title, event, config, jsonConfig, renderFile))
        }
        return results
    },

}