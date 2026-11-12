import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBossFloorsThunk, clearBattleResult } from '../store/bossSlice';
import './BossPage.css';
import BossFloorList from '../components/BossFloorList';
import BossIntelPanel from '../components/BossIntelPanel';
import SquadBuilder from '../components/SquadBuilder';
import BattleLogConsole from '../components/BattleLogConsole';

const BossPage = () => {
  const { floorNumber } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Lấy state từ Redux
  const { user } = useSelector((state) => state.auth);
  const { bosses, isLoading, isBattling, error } = useSelector((state) => state.boss);

  // Mảng chứa ID các thẻ đang chọn vào đội hình
  const [selectedCards, setSelectedCards] = useState([]);

  // Tải danh sách tầng khi vừa vào trang
  useEffect(() => {
    if (user?.id) {
      dispatch(fetchBossFloorsThunk(user.id));
    }
  }, [dispatch, user]);
  useEffect(() => {
    dispatch(clearBattleResult());
  }, [floorNumber, dispatch]);

  // Tìm thông tin của tầng hiện tại đang được chọn trên URL
  const activeBoss = bosses.find((b) => b.floor_number === Number(floorNumber));

  if (isLoading) {
    return <main className="boss-page-container"><h2 style={{textAlign: 'center', color: '#00f0ff'}}>ĐANG TẢI DỮ LIỆU THÁP BOSS...</h2></main>;
  }

  if (error) {
    return <main className="boss-page-container"><h2 style={{color: '#ff003c'}}>LỖI: {error}</h2></main>;
  }

  return (
    <main className="boss-page-container">
      <header className="boss-header">
        <h1>THÁP BOSS {activeBoss ? `// TẦNG ${activeBoss.floor_number}` : ''}</h1>
      </header>

      <div className="boss-layout">
        {/* CỘT TRÁI: Danh sách tầng */}
        <aside className="boss-sidebar">
           <BossFloorList />
        </aside>

        {/* CỘT PHẢI: Thông tin Boss & Xếp đội hình */}
        <section className="boss-main-area">
          {activeBoss ? (
            <>
              <BossIntelPanel boss={activeBoss} />
              
              <SquadBuilder activeBoss={activeBoss} />

              <BattleLogConsole />
            </>
          ) : (
            <div className="cyber-panel" style={{ textAlign: 'center', marginTop: '50px' }}>
              <h2 style={{ color: '#aaa' }}>HÃY CHỌN MỘT TẦNG BÊN TRÁI ĐỂ XEM THÔNG TIN</h2>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default BossPage;