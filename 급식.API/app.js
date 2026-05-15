document.addEventListener('DOMContentLoaded', () => {
    let currentDate = new Date();
    
    // 자운고 고정 코드
    const ATPT_OFCDC_SC_CODE = 'B10';
    const SD_SCHUL_CODE = '7010703';
    
    // Allergy Map (1~19)
    const ALLERGY_MAP = {
        '1': '난류', '2': '우유', '3': '메밀', '4': '땅콩', '5': '대두',
        '6': '밀', '7': '고등어', '8': '게', '9': '새우', '10': '돼지고기',
        '11': '복숭아', '12': '토마토', '13': '아황산류', '14': '호두', '15': '닭고기',
        '16': '쇠고기', '17': '오징어', '18': '조개류', '19': '잣'
    };

    // 맛있는 메뉴 키워드 리스트
    const DELICIOUS_KEYWORDS = [
        '고기', '치킨', '피자', '스파게티', '돈까스', '마카롱', '갈비', '튀김', 
        '구이', '함박', '소시지', '햄', '마라탕', '새우', '닭', '오리', '삼겹', 
        '바비큐', '바베큐', '스테이크', '케이크', '탕수육', '소바', '제육', '슈크림', '타코야끼'
    ];
    
    // DOM Elements
    const datePicker = document.getElementById('date-picker');
    const relativeDayElement = document.getElementById('relative-day');
    const loadingElement = document.getElementById('loading');
    const mealContent = document.getElementById('meal-content');
    const errorMessage = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');
    const menuList = document.getElementById('menu-list');
    const caloriesVal = document.getElementById('calories-val');
    
    const btnPrev = document.getElementById('prev-day');
    const btnNext = document.getElementById('next-day');
    
    function getApiFormat(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    function getInputFormat(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function updateRelativeDayText(targetDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const compareDate = new Date(targetDate);
        compareDate.setHours(0, 0, 0, 0);
        
        const diffTime = compareDate - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            relativeDayElement.textContent = '오늘';
            relativeDayElement.style.background = 'rgba(59, 130, 246, 0.1)';
            relativeDayElement.style.color = '#60a5fa';
        } else if (diffDays === 1) {
            relativeDayElement.textContent = '내일';
            relativeDayElement.style.background = 'rgba(139, 92, 246, 0.1)';
            relativeDayElement.style.color = '#a78bfa';
        } else if (diffDays === -1) {
            relativeDayElement.textContent = '어제';
            relativeDayElement.style.background = 'rgba(148, 163, 184, 0.1)';
            relativeDayElement.style.color = '#94a3b8';
        } else {
            relativeDayElement.textContent = diffDays > 0 ? `${diffDays}일 후` : `${Math.abs(diffDays)}일 전`;
            relativeDayElement.style.background = 'rgba(255, 255, 255, 0.05)';
            relativeDayElement.style.color = '#94a3b8';
        }
    }
    
    function parseMenuString(menuStr) {
        const items = menuStr.split('<br/>').map(item => item.trim()).filter(Boolean);
        return items.map(item => {
            const match = item.match(/^(.*?)(?:\s*\(([\d\.]+)\))?$/);
            if (match) {
                const name = match[1].trim();
                let allergyStr = '';
                if (match[2]) {
                    const codes = match[2].split('.').filter(Boolean);
                    const allergyNames = codes.map(code => ALLERGY_MAP[code] || code);
                    allergyStr = allergyNames.join(', ');
                }
                
                // 맛있는 메뉴 판별
                const isDelicious = DELICIOUS_KEYWORDS.some(keyword => name.includes(keyword));
                
                return {
                    name: name,
                    allergy: allergyStr,
                    isDelicious: isDelicious
                };
            }
            return { name: item, allergy: '', isDelicious: false };
        });
    }
    
    async function fetchMealData(dateObj) {
        // UI 상태 동기화
        datePicker.value = getInputFormat(dateObj);
        updateRelativeDayText(dateObj);
        
        loadingElement.classList.remove('hidden');
        mealContent.classList.add('hidden');
        errorMessage.classList.add('hidden');
        menuList.innerHTML = ''; 
        
        const apiDateStr = getApiFormat(dateObj);
        const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?Type=json&pIndex=1&pSize=10&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${apiDateStr}`;
        
        try {
            const response = await fetch(url);
            const data = await response.json();
            
            if (data.mealServiceDietInfo) {
                const row = data.mealServiceDietInfo[1].row[0];
                const menus = parseMenuString(row.DDISH_NM);
                const calories = row.CAL_INFO;
                
                // 메뉴 렌더링
                menus.forEach((menu, index) => {
                    const li = document.createElement('li');
                    li.style.animationDelay = `${0.05 * index}s`; 
                    
                    if (menu.isDelicious) {
                        li.classList.add('delicious');
                    }
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'menu-name';
                    // 맛있는 메뉴면 반짝거리는 느낌을 주기 위해 이름 추가
                    nameSpan.textContent = menu.name;
                    
                    if (menu.isDelicious) {
                        nameSpan.textContent += ' ✨'; 
                    }
                    
                    li.appendChild(nameSpan);
                    
                    if (menu.allergy) {
                        const allergySpan = document.createElement('span');
                        allergySpan.className = 'allergy-info';
                        allergySpan.textContent = menu.allergy;
                        li.appendChild(allergySpan);
                    }
                    
                    menuList.appendChild(li);
                });
                
                caloriesVal.textContent = calories;
                
                loadingElement.classList.add('hidden');
                mealContent.classList.remove('hidden');
            } else {
                throw new Error("EMPTY_DATA");
            }
            
        } catch (error) {
            console.error('API Fetch Error:', error);
            loadingElement.classList.add('hidden');
            errorMessage.classList.remove('hidden');
            
            if (error.message === "EMPTY_DATA") {
                errorText.textContent = '이 날의 급식 정보가 없습니다.';
            } else {
                errorText.textContent = '정보를 불러오는 중 오류가 발생했습니다.';
            }
        }
    }
    
    function changeDate(daysToAdd) {
        currentDate.setDate(currentDate.getDate() + daysToAdd);
        fetchMealData(currentDate);
    }
    
    // Event Listeners
    btnPrev.addEventListener('click', () => changeDate(-1));
    btnNext.addEventListener('click', () => changeDate(1));
    
    datePicker.addEventListener('change', (e) => {
        if (e.target.value) {
            currentDate = new Date(e.target.value);
            fetchMealData(currentDate);
        }
    });
    
    // Start initial fetch
    fetchMealData(currentDate);
});
