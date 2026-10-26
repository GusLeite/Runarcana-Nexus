package gusleite.runarcana_nexus.repository;

import gusleite.runarcana_nexus.model.settings.TableSetting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TableSettingRepository extends JpaRepository<TableSetting, String> {}
