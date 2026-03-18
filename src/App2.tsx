import { BrowserRouter as Router } from 'react-router-dom';
import RouterComponent from '@/app/router'; // Router.tsx에서 라우팅 설정한 컴포넌트 import

const App = () => {
  return (
    <Router>
      <RouterComponent /> {/* 라우터 설정을 사용 */}
    </Router>
  );
};

export default App;