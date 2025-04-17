# Sonkil - Emacs-style Text Operations for Obsidian

한국어로 '손길'은 정성 어린 도움이나 섬세한 터치를 뜻합니다.
이 플러그인은 노트를 존중하며, 꼭 필요한 부분에 조용히 손을 내미는 조력자가 되고자 합니다.

## 기능

### 특징
- __비영어권 입력 지원__: 비영어권 입력 사용 중에도 단축키가 정상 동작
- __Kill ring__: 최대 120개 항목을 저장하는 텍스트 저장소
- __클립보드 동기화__: kill/copy된 텍스트는 시스템 클립보드에 자동 동기화
- __멀티 커서 Kill Line__: 여러 커서 위치에서 텍스트를 한 번에 잘라내어 하나의 문단으로 저장

### 이맥스 스타일 단축키

| 단축키 | 설명 |
|-----------|-------------|
| `C-Space` | 현재 커서 위치에 마크 설정 (Set Mark) |
| `C-k` | 현재 커서 위치부터 줄 끝까지 텍스트를 잘라내기 (Kill Line) |
| `C-w` | 마크와 현재 커서 사이의 텍스트를 잘라내기 (Kill Region) |
| `M-w` | 마크와 현재 커서 사이의 텍스트를 복사하기 (Copy Region) |
| `C-y` | Kill ring에서 가장 최근 텍스트 붙여넣기 (Yank, Kill ring이 비어 있으면 시스템 클립보드에서 가져옴) |
| `M-y` | Yank 직후에 사용하면 이전에 잘라낸 텍스트로 순환 (Yank Pop) |
| `C-l` | 에디터 뷰 리센터링 (중앙/상단/하단 순환) |
| `C-g` | 현재 작업 취소 (마크, Yank 모드, 멀티 커서) |

### 기타 단축키

| 단축키 | 설명 |
|-----------|-------------|
| `Ctrl + Alt + ↑` | 현재 줄을 위로 이동 |
| `Ctrl + Alt + ↓` | 현재 줄을 아래로 이동 |
| `Ctrl + Shift + ↑` | 윗줄에 커서 추가 |
| `Ctrl + Shift + ↓` | 아랫줄에 커서 추가 |

## 설치 방법

### 일반 사용자

1. Obsidian 설정에서 "커뮤니티 플러그인" 활성화
2. "안전 모드" 비활성화
3. "Sonkil" 플러그인 설치 및 활성화

### 개발자용

#### 요구사항

- Node.js 18 이상
- npm 10 이상
- Obsidian 데스크톱 앱

#### 개발 환경 설정

1. 프로젝트 클론:

```bash
git clone https://github.com/ohyoungpark/obsidian-sonkil
cd obsidian-sonkil
```

2. Node.js 버전 설정 (nvm 사용):

```bash
nvm use
```

3. 의존성 설치:

```bash
npm install
```

4. 개발 환경 설정:

```bash
# .env 파일 생성
echo "OBSIDIAN_PLUGIN_DIR=/path/to/your/obsidian/plugins/obsidian-sonkil" > .env

# .env 파일의 OBSIDIAN_PLUGIN_DIR 값을 자신의 Obsidian 플러그인 디렉토리 경로로 수정
```

5. 빌드 및 테스트:

```bash
# 빌드
npm run build

# 테스트 실행
npm test

# 개발 모드 설치 (로컬 Obsidian vault에 설치)
npm run install-dev
```

> **참고**:
>
> - `.env` 파일은 Git에 커밋되지 않도록 `.gitignore`에 추가되어 있습니다.
> - 개발 모드 설치 후에는 Obsidian을 재시작해야 변경사항이 적용됩니다.

## Translations

- [English](README.md)
