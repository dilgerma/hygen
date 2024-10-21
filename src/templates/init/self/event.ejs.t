---
to: _templates/generator/demo/event.ejs.t
---
---
to: _templates/demo/events/event.ejs.t
---
---
to: demo/events/<%%%=event%>.ts
---

// <%%%= slice %>
class <%%%=event%> {
    val aggregateId: UUID
    <%%%=fields%>
}