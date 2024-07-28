javascript:(function(){ 
    const frameset = document.getElementsByTagName('frameset')[0]; 
    if (frameset && frameset.children.length >= 2) {
        const secondFrame = frameset.children[1];
        const secondFrameDocument = secondFrame.contentDocument || secondFrame.contentWindow.document; 
        const innerFrameset = secondFrameDocument.getElementsByTagName('frameset')[0]; 
        if (innerFrameset && innerFrameset.children.length >= 2) {
            const thirdFrame = innerFrameset.children[1]; 
            const thirdFrameDocument = thirdFrame.contentDocument || thirdFrame.contentWindow.document;  
            const steps = thirdFrameDocument.getElementsByClassName('step_status');
            for (let i = 0; i < steps.length; i++) {
                steps[i].value = 'p'; 
            }
            const time = thirdFrameDocument.getElementById('execution_duration');
            if (time) {
                time.value = '10';
            }
            const notes = thirdFrameDocument.getElementsByTagName('textarea');
            const final_notes= notes[notes.length - 2];
            if (final_notes) {
                final_notes.value = 'As Expected';
            } 
            var node = thirdFrameDocument.querySelector('img[title="Click to set to passed and move to next"]');
            node.click();
        }
    }
})();