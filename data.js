// Game Data: Cards and Tiles

const MEANS_CARDS = [
    "Thuốc độc", "Súng lục", "Súng bắn tỉa", "Dao găm", "Chất nổ", "Virus", "Khí độc", "Dây siết", "Gậy bóng chày", "Xe hơi",
    "Chết đuối", "Ngạt thở", "Phóng hỏa", "Điện giật", "Quá liều", "Bỏ đói", "Mất nước", "Phóng xạ", "Lạnh cóng", "Sốc nhiệt",
    "Rắn độc", "Nhện độc", "Bọ cạp", "Ong bắp cày", "Ong mật", "Kiến lửa", "Muỗi", "Bọ ve", "Bọ chét", "Chấy rận",
    "Gạch men", "Búa tạ", "Cưa máy", "Dao mổ", "Kim tiêm", "Dây thừng", "Túi nilon", "Gối", "Lọ hoa", "Tượng đồng",
    "Nấm độc", "Thủy ngân", "Axit", "Xăng", "Dầu hỏa", "Khí than", "Máy sấy tóc", "Bàn là", "Kéo", "Tua vít"
];

const EVIDENCE_CARDS = [
    "Vân tay", "Dấu chân", "Vết máu", "Sợi tóc", "Sợi vải", "Cúc áo", "Hóa đơn", "Vé xe", "Ảnh", "Thư từ",
    "Nhẫn", "Đồng hồ", "Điện thoại", "Ví tiền", "Chìa khóa", "Kính mắt", "Bút", "USB", "Laptop", "Máy tính bảng",
    "Cốc", "Chai nước", "Vỏ lon", "Cái đĩa", "Cái dĩa", "Con dao", "Cái thìa", "Đũa", "Ống hút", "Khăn giấy",
    "Vé xem phim", "Vé máy bay", "Thẻ ngân hàng", "Son môi", "Phấn trang điểm", "Dây chuyền", "Bông tai", "Vòng tay", "Thắt lưng", "Giày",
    "Tất", "Găng tay", "Mũ", "Khẩu trang", "Bật lửa", "Bao diêm", "Thuốc lá", "Kẹo cao su", "Vỏ kẹo", "Danh thiếp"
];

const SCENE_TILES = [
    {
        name: "Nguyên nhân cái chết",
        type: "cause", // Red tile, mandatory
        options: ["Ngạt thở", "Chấn thương nặng", "Mất máu", "Bệnh lý", "Ngộ độc", "Tai nạn"]
    },
    {
        name: "Vị trí vụ án",
        type: "location", // Brown tile
        options: ["Trong nhà", "Ngoài trời", "Nơi công cộng", "Nơi riêng tư", "Dưới nước", "Trong rừng"]
    },
    {
        name: "Tình trạng thi thể",
        type: "general", // Green tile
        options: ["Còn ấm", "Cứng đờ", "Phân hủy", "Không nguyên vẹn", "Bị thiêu cháy", "Bình thường"]
    },
    {
        name: "Dấu vết để lại",
        type: "general",
        options: ["Hỗn loạn", "Sạch sẽ", "Dấu chân lạ", "Vật dụng vỡ", "Vết kéo lê", "Mảnh vụn"]
    },
    {
        name: "Biểu hiện nạn nhân",
        type: "general",
        options: ["Hoảng loạn", "Bình thản", "Đau đớn", "Bất ngờ", "Giận dữ", "Sợ hãi"]
    },
    {
        name: "Thời điểm phát hiện",
        type: "general",
        options: ["Sáng sớm", "Buổi trưa", "Hoàng hôn", "Nửa đêm", "Rạng sáng", "Giờ cao điểm"]
    },
    {
        name: "Đặc điểm hung thủ",
        type: "general",
        options: ["Cao lớn", "Thấp bé", "Khéo léo", "Vụng về", "Mạnh mẽ", "Thông minh"]
    },
    {
        name: "Quan hệ với nạn nhân",
        type: "general",
        options: ["Người lạ", "Người quen", "Kẻ thù", "Người yêu", "Đồng nghiệp", "Họ hàng"]
    }
];

// Helper to shuffle array
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex != 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Select random items from array
function getRandomItems(array, count) {
    const shuffled = shuffle([...array]);
    return shuffled.slice(0, count);
}

function generateCrimeStory(means, evidence) {
    let cause = "Chấn thương nặng";
    // Simple logic mapping
    const poisons = ["Thuốc độc", "Virus", "Khí độc", "Quá liều", "Rắn độc", "Nhện độc", "Bọ cạp", "Ong bắp cày", "Ong mật", "Kiến lửa", "Nấm độc", "Thủy ngân", "Axit", "Khí than"];
    const suffocation = ["Dây siết", "Chết đuối", "Ngạt thở", "Bỏ đói", "Mất nước", "Dây thừng", "Túi nilon", "Gối"];
    const bleeding = ["Súng lục", "Súng bắn tỉa", "Dao găm", "Rìu", "Kéo", "Mảnh kính", "Dao mổ", "Kim tiêm", "Cưa máy", "Gạch men"];

    if (poisons.includes(means)) cause = "Ngộ độc";
    else if (suffocation.includes(means)) cause = "Ngạt thở";
    else if (bleeding.includes(means)) cause = "Mất máu";

    const storyTemplates = [
        `Nạn nhân đã bị sát hại dã man bằng ${means}. Kẻ thủ ác đã vô tình để lại ${evidence} tại hiện trường.`,
        `Một vụ án chấn động! ${means} được tìm thấy cạnh thi thể. Manh mối quan trọng nhất là ${evidence}.`,
        `Hiện trường cho thấy sự giằng co, nhưng nguyên nhân chính là ${means}. Cảnh sát đã thu giữ ${evidence} để điều tra.`,
        `Trong bóng tối, ${means} đã cướp đi sinh mạng nạn nhân. Chỉ có ${evidence} là vật chứng duy nhất sót lại.`
    ];

    const story = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];

    return {
        story: story,
        suggestions: {
            cause: cause
        }
    };
}

module.exports = {
    MEANS_CARDS,
    EVIDENCE_CARDS,
    SCENE_TILES,
    shuffle,
    getRandomItems,
    generateCrimeStory
};
