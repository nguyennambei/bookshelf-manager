function navigateTo(viewId) {
    // 1. Ẩn tất cả các view
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // 2. Hiển thị view được chọn
    const activeSection = document.getElementById(viewId);
    if (activeSection) {
        activeSection.classList.add('active');
    }

    // 3. Cập nhật tiêu đề của khung Legend nội dung bên phải
    const titleMap = {
        'dashboard-view': 'Trang Chủ (Dashboard)',
        'all-manga-view': 'Tổng Kho Truyện',
        'add-manga-view': 'Nhập Tập Mới'
    };
    if (titleMap[viewId]) {
        document.getElementById('page-title').innerText = titleMap[viewId];
    }
}

function openMangaDetail(mangaName) {
    document.getElementById('detail-manga-name').innerText = "Bộ truyện: " + mangaName;
    document.getElementById('page-title').innerText = "Kiểm Tra Bản Ghi Tập Truyện";

    const volumeListContainer = document.getElementById('detail-volume-list');
    volumeListContainer.innerHTML = ''; 

    let mockVolumes = [];
    if (mangaName.includes('Conan')) {
        mockVolumes = [1, 2, 3, 4, 5, 50, 100, 101];
    } else if (mangaName.includes('One Piece')) {
        mockVolumes = [1, 2, 3, 99, 100, 101, 102, 103, 104];
    } else {
        mockVolumes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    }

    mockVolumes.forEach(vol => {
        const volDiv = document.createElement('div');
        volDiv.className = 'volume-item';
        volDiv.innerText = `Tập ${vol}`;
        volumeListContainer.appendChild(volDiv);
    });

    // Chuyển màn hình sang khu vực chi tiết
    document.querySelectorAll('.view-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('manga-detail-view').classList.add('active');
}