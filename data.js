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
        options: ["Ngạt thở", "Chấn thương nặng", "Mất máu", "Bệnh lý", "Ngộ độc"]
    },
    {
        name: "Hiện trường vụ án",
        type: "location", // Brown tile
        options: ["Phòng khách", "Phòng ngủ", "Bếp", "Phòng tắm", "Ban công", "Văn phòng", "Vườn", "Gara", "Công viên", "Đường phố", "Trường học", "Bệnh viện", "Khách sạn", "Nhà hàng", "Quán Bar", "Club", "Cửa hàng", "Trung tâm nua sắm", "Rạp phim", "Nhà hát", "Bảo tàng", "Thư viện", "Phòng Gym", "Hồ bơi", "Bãi biển", "Rừng", "Núi", "Sông", "Hồ", "Biển"]
    },
    {
        name: "Dấu vết tại hiện trường",
        type: "general", // Green tile
        options: ["Vân tay", "Dấu chân", "Vết bầm", "Vết máu", "Dịch cơ thể", "Sẹo", "Hình xăm", "Vết trang điểm", "Nước hoa", "Thuốc lá", "Rượu", "Ma túy", "Thức ăn", "Đất", "Bùn", "Bụi", "Tro tàn", "Mảnh kính", "Kim loại", "Nhựa", "Vải", "Giấy", "Sơn", "Dầu", "Nước", "Đá lạnh", "Tuyết", "Lửa", "Khói", "Khí ga"]
    },
    {
        name: "Tình trạng hiện trường",
        type: "general",
        options: ["Bừa bộn", "Gọn gàng", "Tối tăm", "Sáng sủa", "Nóng", "Lạnh", "Ẩm ướt", "Khô ráo", "Yên tĩnh", "Ồn ào", "Có mùi hôi", "Thơm tho", "Đông đúc", "Vắng vẻ", "Đã khóa", "Mở cửa", "Hư hại", "Nguyên vẹn", "Cũ kỹ", "Mới", "Hiện đại", "Cổ điển", "Sang trọng", "Rẻ tiền", "Ấm cúng", "Rộng rãi", "Ngăn nắp", "Hỗn loạn", "An toàn", "Nguy hiểm"]
    },
    {
        name: "Trang phục nạn nhân",
        type: "general",
        options: ["Gọn gàng", "Xộc xệch", "Sang trọng", "Thường phục", "Đồng phục", "Đồ công sở", "Đồ thể thao", "Đồ ngủ", "Đồ bơi", "Đồ lót", "Khỏa thân", "Hóa trang", "Đồ mùa đông", "Đồ mùa hè", "Đồ mùa xuân", "Đồ mùa thu", "Trang trọng", "Dự tiệc", "Đám cưới", "Đám tang", "Tôn giáo", "Truyền thống", "Quân đội", "Y tế", "Công trường", "Cảnh sát", "Cứu hỏa", "Học sinh", "Đầu bếp", "Họa sĩ"]
    },
    {
        name: "Dáng người nạn nhân",
        type: "general",
        options: ["To lớn", "Gầy gò", "Cao", "Thấp", "Cơ bắp", "Béo", "Da bọc xương", "Trung bình", "Khỏe mạnh", "Yếu ớt", "Săn chắc", "Nhão", "Dáng thể thao", "Mũm mĩm", "Tròn trịa", "Mảnh khảnh", "Nhỏ nhắn", "Khổng lồ", "Tí hon", "Dị dạng", "Bị thương", "Khỏe mạnh", "Ốm yếu", "Mang thai", "Trẻ", "Già", "Trẻ em", "Sơ sinh", "Thiếu niên", "Người lớn"]
    },
    {
        name: "Thời điểm gây án",
        type: "general",
        options: ["Ngày thường", "Cuối tuần", "Ngày lễ", "Nắng", "Mưa", "Nhiều mây", "Có gió", "Tuyết rơi", "Bão", "Sương mù", "Nóng", "Lạnh", "Ấm áp", "Mát mẻ", "Khô", "Ẩm", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật", "Buổi sáng", "Buổi chiều", "Buổi tối", "Ban đêm", "Bình minh", "Hoàng hôn", "Nửa đêm"]
    },
    {
        name: "Thời gian diễn ra",
        type: "general",
        options: ["Tức thời", "Ngắn ngủi", "Dần dần", "Kéo dài", "Vài giây", "Vài phút", "Vài giờ", "Vài ngày", "Vài tuần", "Vài tháng", "Vài năm", "Thập kỷ", "Thế kỷ", "Thiên niên kỷ", "Vô tận", "Mãi mãi", "Không bao giờ", "Không rõ", "Thay đổi", "Định kỳ", "Liên tục", "Ngắt quãng", "Ngẫu nhiên", "Theo chu kỳ", "Một lần", "Hai lần", "Nhiều lần", "Thường xuyên", "Hiếm khi", "Luôn luôn"]
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
