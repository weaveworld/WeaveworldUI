W$TYPE={ $name:'ToDo',
   newTodo: function(el,self){
     return { };
   },          
};
W$TYPE={ $name:'Item',
    text$required: true,
    text$length: 120,
    text$pattern: '.*\\S.*',
    text$placeholder: 'Add a task',
    itemDelete: function(el,ev,arg){
      w$weave(el,'-'); 
    },      
    itemAdd: function(el,ev,arg){ 
      const list=w$list(el);
      const text=(arg.text || '').trim();
      if(!text){ return; }
      const nextId=list.reduce((max,todo) => Math.max(max,todo.id || 0),0) + 1;
      w$weave(el,']',{id:nextId,text:text});
      el.reset();
    }
};

W$DATA={ 
  list: [
    { id: 1, text: 'clean the house' },
    { id: 2, text: 'buy milk' }
  ]
};
