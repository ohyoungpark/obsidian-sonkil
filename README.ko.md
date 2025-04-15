# Sonkil - Emacs-style Text Operations for Obsidian

Sonkil은 Obsidian에서 이맥스 스타일의 텍스트 조작 기능과 추가 기능을 제공하는 플러그인입니다. 이맥스의 강력한 텍스트 조작 기능을 Obsidian에서도 사용할 수 있게 해주며, 노트 작성에 최적화된 현대적인 기능들도 추가하였습니다.

## 기능

### 핵심 이맥스 스타일 기능

| 단축키 | 설명 |
|-----------|-------------|
| `C-Space` | 현재 커서 위치에 마크 설정 (Set Mark) |
| `C-k` | 현재 커서 위치부터 줄 끝까지 텍스트를 잘라내기 (Kill Line) |
| `C-w` | 마크와 현재 커서 사이의 텍스트를 잘라내기 (Kill Region) |
| `M-w` | 마크와 현재 커서 사이의 텍스트를 복사하기 (Copy Region) |
| `C-y` | Kill ring에서 가장 최근 텍스트 붙여넣기 (Yank) |
| `M-y` | Yank 직후에 사용하면 이전에 잘라낸 텍스트로 순환 (Yank Pop) |
| `C-l` | 에디터 뷰 리센터링 (중앙/상단/하단 순환) |
| `C-g` | 현재 작업 취소 (마크, Yank 모드, 멀티 커서) |
| `ESC` | `C-g`와 동일한 기능을 수행하며, 추가 작업을 위한 ESC 상태 유지 |

### 향상된 기능

| 단축키 | 설명 |
|-----------|-------------|
| `Ctrl + Cmd + ↑` | 현재 줄을 위로 이동 (macOS) |
| `Ctrl + Cmd + ↓` | 현재 줄을 아래로 이동 (macOS) |
| `Ctrl + Shift + ↑` | 윗줄에 커서 추가 |
| `Ctrl + Shift + ↓` | 아랫줄에 커서 추가 |

### 클립보드 통합

- 최대 60개 항목을 저장하는 Kill ring
- Kill ring이 비어있을 때 `C-y`를 사용하면 시스템 클립보드의 내용을 가져옴
- 잘라내기/복사한 텍스트는 시스템 클립보드와 자동 동기화

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
