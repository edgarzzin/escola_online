
let activeSubtopic = '';

// Função para alternar a visibilidade dos subtópicos
function toggleSubTopics(id) {
    const subTopics = document.getElementById(id + '-subtopics');
    const arrow = document.getElementById(id + '-arrow');
    subTopics.classList.toggle('hidden');
    arrow.classList.toggle('arrow-up');
}

// Função para selecionar um subtópico e definir o subtópico ativo
function selectTopic(subtopicName) {
    // Remove a classe 'active-subtopic' de todos os subtópicos
    document.querySelectorAll('#sidebar ul li ul li').forEach(sub => sub.classList.remove('active-subtopic'));

    
    const subtopicElements = [...document.querySelectorAll('#sidebar ul li ul li')];
    const selectedSubtopic = subtopicElements.find(sub => sub.textContent.trim() === subtopicName.trim());

    if (selectedSubtopic) {
        selectedSubtopic.classList.add('active-subtopic');
    }

    
    activeSubtopic = subtopicName;

    
    const chatContainer = document.getElementById('chat-container');
    chatContainer.innerHTML = ''; // Limpa o chat anterior
    const welcomeMessage = document.createElement('div');
    welcomeMessage.classList.add('chat-message');
    welcomeMessage.innerHTML = `<img src="https://cdn-icons-png.flaticon.com/512/197/197386.png" alt="Foto de Perfil"><p class="user-message">Você está no subtópico: ${subtopicName}</p>`;
    chatContainer.appendChild(welcomeMessage);
}


function addUserMessageToChat(messageText) {
    const chatContainer = document.getElementById('chat-container');

    
    const userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('chat-message', 'sent-message', 'text-right');

    const messageContent = document.createElement('div');
    messageContent.classList.add('flex', 'items-center', 'justify-end');

    const messageParagraph = document.createElement('p');
    messageParagraph.classList.add('user-message', 'bg-blue-600', 'text-white', 'p-2', 'rounded-lg', 'inline-block', 'max-w-xs', 'mr-2');
    messageParagraph.textContent = messageText;

    const profileImg = document.createElement('img');
    profileImg.src = document.getElementById('profile-pic-display').src;
    profileImg.alt = 'Foto de Perfil';
    profileImg.classList.add('w-8', 'h-8', 'rounded-full');

    
    messageContent.appendChild(messageParagraph);
    messageContent.appendChild(profileImg);
    userMessageDiv.appendChild(messageContent);

    
    chatContainer.appendChild(userMessageDiv);

    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}


function displayIaMessage(iaMessage) {
    const chatContainer = document.getElementById('chat-container');

    
    const iaMessageDiv = document.createElement('div');
    iaMessageDiv.classList.add('chat-message', 'received-message');

    const iaMessageContent = document.createElement('div');
    iaMessageContent.classList.add('flex', 'items-center', 'justify-start'); 

    const iaMessageParagraph = document.createElement('p');
    iaMessageParagraph.classList.add('ia-message', 'bg-gray-200', 'text-black', 'p-2', 'rounded-lg', 'inline-block', 'max-w-xs', 'ml-2');
    iaMessageParagraph.textContent = iaMessage;

    const iaProfileImg = document.createElement('img');
    iaProfileImg.src = 'https://cdn-icons-png.flaticon.com/512/197/197386.png'; // URL da imagem de perfil da IA
    iaProfileImg.alt = 'Foto de Perfil da IA';
    iaProfileImg.classList.add('w-8', 'h-8', 'rounded-full', 'mr-2');

    
    iaMessageContent.appendChild(iaProfileImg);
    iaMessageContent.appendChild(iaMessageParagraph);
    iaMessageDiv.appendChild(iaMessageContent);

    
    chatContainer.appendChild(iaMessageDiv);

    
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function loadUserProfile() {
    const response = await fetch('/getProfile');
    const user = await response.json();
    document.getElementById('name').value = user.name;
    document.getElementById('email').value = user.email;
    document.getElementById('rua').value = user.rua;
    document.getElementById('bairro').value = user.bairro;
    document.getElementById('cidade').value = user.cidade;
    document.getElementById('estado').value = user.estado;
    document.getElementById('cep').value = user.cep;
    document.getElementById('profile-pic-display').src = user.profile_pic;
}


window.onload = loadUserProfile;