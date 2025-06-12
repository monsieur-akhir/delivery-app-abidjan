import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { GamificationService } from '../../services/GamificationService';
import { GamificationBadge } from '../../components/GamificationBadge';
import type { GamificationProfile, Ranking, Reward } from '../../types/models';

export const GamificationScreen: React.FC = () => {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'leaderboard' | 'rewards'>('profile');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const gamificationService = new GamificationService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileData, rankingsData, rewardsData] = await Promise.all([
        gamificationService.getProfile(),
        gamificationService.getRankings(),
        gamificationService.getAvailableRewards(),
      ]);

      setProfile(profileData);
      setRankings(rankingsData);
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error loading gamification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const claimReward = async (rewardId: string) => {
    try {
      await gamificationService.claimReward(rewardId);
      await loadData(); // Refresh data
    } catch (error) {
      console.error('Error claiming reward:', error);
    }
  };

  const renderProfileTab = () => (
    <ScrollView style={styles.tabContent}>
      {profile && (
        <>
          {/* Level Progress */}
          <View style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Text style={styles.levelTitle}>Niveau {profile.level}</Text>
              <Text style={styles.xpText}>{profile.experience_points} XP</Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(profile.experience_points % 1000) / 10}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {1000 - (profile.experience_points % 1000)} XP jusqu'au niveau suivant
            </Text>
          </View>

          {/* Badges */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mes Badges</Text>
            <View style={styles.badgesGrid}>
              {profile.badges.map((badge) => (
                <GamificationBadge
                  key={badge.id}
                  badge={badge}
                  size="large"
                />
              ))}
            </View>
          </View>

          {/* Achievements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Objectifs</Text>
            {profile.achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                </View>
                <View style={styles.achievementProgress}>
                  <Text style={styles.progressText}>
                    {achievement.progress}/{achievement.target}
                  </Text>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(achievement.progress / achievement.target) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderLeaderboardTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Classement Général</Text>
        {rankings.map((ranking, index) => (
          <View key={ranking.courier_id} style={styles.rankingCard}>
            <View style={styles.rankingPosition}>
              <Text style={styles.positionText}>#{ranking.position}</Text>
            </View>
            <View style={styles.rankingInfo}>
              <Text style={styles.courierName}>{ranking.courier_name}</Text>
              <Text style={styles.courierPoints}>{ranking.points} points</Text>
            </View>
            <View style={styles.rankingLevel}>
              <Text style={styles.levelBadge}>Niv. {ranking.level}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderRewardsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Récompenses Disponibles</Text>
        {rewards.map((reward) => (
          <View key={reward.id} style={styles.rewardCard}>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardDesc}>{reward.description}</Text>
              <Text style={styles.rewardPoints}>{reward.points_required} points requis</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.claimButton,
                !reward.is_available && styles.claimButtonDisabled
              ]}
              onPress={() => claimReward(reward.id)}
              disabled={!reward.is_available}
            >
              <Text style={styles.claimButtonText}>
                {reward.is_available ? 'Réclamer' : 'Indisponible'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gamification</Text>
        <TouchableOpacity onPress={onRefresh}>
          <Feather name="refresh-cw" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
            Profil
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
          onPress={() => setActiveTab('leaderboard')}
        >
          <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
            Classement
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
            Récompenses
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'leaderboard' && renderLeaderboardTab()}
        {activeTab === 'rewards' && renderRewardsTab()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#6c757d',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    padding: 20,
  },
  levelCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  levelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  xpText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginRight: 12,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    color: '#6c757d',
  },
  achievementProgress: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  rankingCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankingPosition: {
    width: 40,
    alignItems: 'center',
  },
  positionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  rankingInfo: {
    flex: 1,
    marginLeft: 16,
  },
  courierName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  courierPoints: {
    fontSize: 14,
    color: '#6c757d',
  },
  rankingLevel: {
    alignItems: 'flex-end',
  },
  levelBadge: {
    backgroundColor: '#007AFF',
    color: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '600',
  },
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
    marginRight: 12,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  rewardDesc: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  rewardPoints: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  claimButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  claimButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});