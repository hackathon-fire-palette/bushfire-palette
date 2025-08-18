document.addEventListener('DOMContentLoaded', () => {
  const socialFeedElement = document.getElementById('socialFeed');
  const feedSearchInput = document.getElementById('feedSearchInput');
  const filterFeedBtn = document.getElementById('filterFeedBtn');
  const refreshFeedBtn = document.getElementById('refreshFeedBtn');

  const recoveryBoardElement = document.getElementById('recoveryBoard');
  const infoCategoryFilter = document.getElementById('infoCategoryFilter');
  const applyBoardFilterBtn = document.getElementById('applyBoardFilter');

  // Dummy data for social media posts
  let socialPosts = [
    {
      id: 'post1',
      text: 'Road closed near Perth Hills due to fallen trees. Avoid Mundaring Weir Rd. #bushfire #PerthHills',
      user: '@LocalResidentWA',
      timestamp: Date.now() - 1000 * 60 * 35, // 35 mins ago
      location: { lat: -31.97, lng: 116.12 },
      tags: ['damaged-roads', 'bushfire']
    },
    {
      id: 'post2',
      text: 'Our community needs water and non-perishable food supplies at the Toodyay evacuation center. #communityneeds #Toodyay',
      user: '@ToodyaySupport',
      timestamp: Date.now() - 1000 * 60 * 90, // 1.5 hours ago
      location: { lat: -31.54, lng: 116.46 },
      tags: ['community-needs', 'aid-distribution']
    },
    {
      id: 'post3',
      text: 'Power is out in parts of Roleystone. DFES crews are on site. Stay safe! #Roleystone #poweroutage',
      user: '@DFES_WA_Alerts',
      timestamp: Date.now() - 1000 * 60 * 60 * 3, // 3 hours ago
      location: { lat: -32.12, lng: 116.08 },
      tags: ['damaged-infrastructure']
    },
    {
      id: 'post4',
      text: 'Seeking temporary shelter for a family of four in Mandurah. Any leads appreciated. #Mandurah #shelter',
      user: '@WA_Help',
      timestamp: Date.now() - 1000 * 60 * 60 * 5, // 5 hours ago
      location: { lat: -32.52, lng: 115.72 },
      tags: ['community-needs', 'shelter-info']
    },
    {
      id: 'post5',
      text: 'Just saw a fire truck heading towards Kalamunda. Hope everyone is safe. #Kalamunda #bushfire',
      user: '@PerthObserver',
      timestamp: Date.now() - 1000 * 60 * 15, // 15 mins ago
      location: { lat: -31.97, lng: 116.05 },
      tags: ['bushfire']
    }
  ];

  // Dummy data for recovery intelligence board
  let recoveryIntelligence = [
    {
      id: 'intel1',
      category: 'damaged-roads',
      title: 'Mundaring Weir Rd Closure',
      details: 'Section of Mundaring Weir Rd closed between XX and YY due to fallen trees and power lines. Detour via ZZZ. Estimated re-opening: 24-48 hours.',
      source: 'DFES Incident Report',
      timestamp: Date.now() - 1000 * 60 * 40,
      location: { lat: -31.97, lng: 116.12 }
    },
    {
      id: 'intel2',
      category: 'community-needs',
      title: 'Toodyay Water & Food Appeal',
      details: 'Urgent need for bottled water and non-perishable food items at Toodyay Community Hall. Drop-off point established. Volunteers needed for distribution.',
      source: 'Local Council Announcement',
      timestamp: Date.now() - 1000 * 60 * 100,
      location: { lat: -31.54, lng: 116.46 }
    },
    {
      id: 'intel3',
      category: 'shelter-info',
      title: 'Mandurah Emergency Shelter Open',
      details: 'Mandurah Recreation Centre now open as an emergency shelter. Capacity for 150 people. Pets welcome (crated).',
      source: 'Red Cross WA',
      timestamp: Date.now() - 1000 * 60 * 60 * 4,
      location: { lat: -32.52, lng: 115.72 }
    },
    {
      id: 'intel4',
      category: 'aid-distribution',
      title: 'Perth Hills Aid Distribution Point',
      details: 'Aid distribution point established at Kalamunda Primary School. Distributing first aid kits, blankets, and hygiene supplies. Open 9 AM - 5 PM daily.',
      source: 'Salvation Army',
      timestamp: Date.now() - 1000 * 60 * 60 * 7,
      location: { lat: -31.97, lng: 116.05 }
    }
  ];

  function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  function renderSocialFeed(posts) {
    socialFeedElement.innerHTML = '';
    if (posts.length === 0) {
      socialFeedElement.innerHTML = '<p style="text-align: center; color: #888;">No posts found matching your criteria.</p>';
      return;
    }
    posts.forEach(post => {
      const postDiv = document.createElement('div');
      postDiv.style.borderBottom = '1px solid #eee';
      postDiv.style.padding = '0.8em 0';
      postDiv.innerHTML = `
        <p style="margin:0;font-weight:bold;">${post.user} <span style="font-size:0.8em;color:#888;">(${timeAgo(post.timestamp)})</span></p>
        <p style="margin:0.5em 0;">${post.text}</p>
        ${post.location ? `<p style="margin:0;font-size:0.9em;color:#555;">Geo-tagged: Lat ${post.location.lat.toFixed(2)}, Lng ${post.location.lng.toFixed(2)}</p>` : ''}
      `;
      socialFeedElement.appendChild(postDiv);
    });
  }

  function filterSocialFeed() {
    const searchTerm = feedSearchInput.value.toLowerCase();
    const filteredPosts = socialPosts.filter(post => {
      const textMatch = post.text.toLowerCase().includes(searchTerm);
      const userMatch = post.user.toLowerCase().includes(searchTerm);
      // Simple location match (e.g., if search term is part of a known location name in the text)
      const locationMatch = post.text.toLowerCase().includes(searchTerm); 
      return textMatch || userMatch || locationMatch;
    });
    renderSocialFeed(filteredPosts);
  }

  function refreshSocialFeed() {
    // In a real application, this would fetch new data from an API
    // For now, just re-render existing data
    renderSocialFeed(socialPosts);
    alert('Social media feed refreshed!');
  }

  function renderRecoveryBoard(items) {
    recoveryBoardElement.innerHTML = '';
    if (items.length === 0) {
      recoveryBoardElement.innerHTML = '<p style="text-align: center; color: #888;">No intelligence items to display for this category.</p>';
      return;
    }
    items.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.style.borderBottom = '1px solid #eee';
      itemDiv.style.padding = '0.8em 0';
      itemDiv.innerHTML = `
        <p style="margin:0;font-weight:bold;">${item.title} <span style="font-size:0.8em;color:#888;">(${item.category.replace('-', ' ')})</span></p>
        <p style="margin:0.5em 0;">${item.details}</p>
        <p style="margin:0;font-size:0.9em;color:#555;">Source: ${item.source} (${timeAgo(item.timestamp)})</p>
        ${item.location ? `<p style="margin:0;font-size:0.9em;color:#555;">Location: Lat ${item.location.lat.toFixed(2)}, Lng ${item.location.lng.toFixed(2)}</p>` : ''}
      `;
      recoveryBoardElement.appendChild(itemDiv);
    });
  }

  function filterRecoveryBoard() {
    const selectedCategory = infoCategoryFilter.value;
    let filteredItems = recoveryIntelligence;
    if (selectedCategory !== 'all') {
      filteredItems = recoveryIntelligence.filter(item => item.category === selectedCategory);
    }
    renderRecoveryBoard(filteredItems);
  }

  // Event Listeners
  filterFeedBtn.addEventListener('click', filterSocialFeed);
  feedSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') filterSocialFeed();
  });
  refreshFeedBtn.addEventListener('click', refreshSocialFeed);

  applyBoardFilterBtn.addEventListener('click', filterRecoveryBoard);

  // Initial render
  renderSocialFeed(socialPosts);
  renderRecoveryBoard(recoveryIntelligence);
});
